import { HttpService } from '@nestjs/axios';
import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { Job, Queue } from 'bullmq';
import { CreateMediaSourceStatusEnum } from 'src/common/enum/create-media-source-status.enum';
import { MediaSourceStatusEnum } from 'src/common/enum/media-source-status.enum';
import { MediaTypeEnum } from 'src/common/enum/media-type.enum';
import { PrismaService } from 'src/prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';
import { resolve } from 'path';
import { createWriteStream } from 'fs';

@Processor('crawl-media', { concurrency: 5000 })
export class MediaSourceProcessor extends WorkerHost {
  private downloadDir: string = './download';
  private concurrentImageDownloading: number = 10;
  private canCheckForAvailableImageDownloadJob: boolean = false;
  private canParseImageAndVideoFromSource: boolean = true;
  constructor(
    private prismaService: PrismaService,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @InjectQueue('crawl-media')
    private readonly crawlMediaQueue: Queue,
  ) {
    super();
    this.downloadDir =
      configService.get('server.downloadDir') || this.downloadDir;
    this.concurrentImageDownloading =
      configService.get('server.concurrentImageDownloading') ||
      this.concurrentImageDownloading;
    this.buildDownloadImageJobs();
    this.crawlMediaQueue.add(
      'check-for-available-download-image',
      {},
      {
        repeat: {
          every: 10 * 1000,
        },
      },
    );

    this.crawlMediaQueue.add(
      'check-available-media-source',
      {},
      {
        repeat: {
          pattern: '*/30 * * * *',
        },
        jobId: 'check-available-media-source',
      },
    );
  }
  async process(job: Job<any, any, string>): Promise<any> {
    switch (job.name) {
      case 'store-media-source':
        this.bulkCreate(job.data.code, job.data.urls);
        break;
      case 'get-media-source-url':
        this.crawlImagesAndVideos(job.data);
        break;
      case 'download-image':
        this.downloadImage(job.data);
        break;
      case 'check-for-available-download-image':
        this.checkForAvailableDownloadImage();
        break;
      case 'check-available-media-source':
        this.checkForAvailableMediaSource();
        break;
    }
    return {};
  }
  async checkForAvailableDownloadImage() {
    console.log(
      'checkForAvailableDownloadImage',
      this.canCheckForAvailableImageDownloadJob,
    );
    if (!this.canCheckForAvailableImageDownloadJob) return;
    await this.buildDownloadImageJobs();
  }
  async checkForAvailableMediaSource() {
    console.log(
      'checkForAvailableMediaSource',
      this.canParseImageAndVideoFromSource,
    );
    if (!this.canParseImageAndVideoFromSource) return;

    const mediaSource = await this.prismaService.mediaSource.findMany({
      orderBy: {
        createdAt: 'asc',
      },
      skip: 1,
      take: 5000,
    });
    if (mediaSource.length > 0) {
      this.canParseImageAndVideoFromSource = false;
      await this.getImagesVideosFromSrc(mediaSource);
    } else {
      this.canParseImageAndVideoFromSource = true;
    }
  }
  async pullNextImageForDownload() {
    const image = await this.prismaService.media.findFirst({
      where: {
        status: MediaSourceStatusEnum.NOT_PROCESSED,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
    if (!image) {
      this.canCheckForAvailableImageDownloadJob = true;
      return;
    }
    this.canCheckForAvailableImageDownloadJob = false;
    await this.prismaService.media.update({
      where: {
        id: image.id,
      },
      data: {
        status: MediaSourceStatusEnum.PROCESSING,
      },
    });
    return this.crawlMediaQueue.add('download-image', image);
  }
  async downloadImage(image: any) {
    try {
      const response = await this.httpService.axiosRef({
        method: 'GET',
        url: image.url,
        responseType: 'stream',
      });
      if (response.status == 200 || response.status == 201) {
        const writter = createWriteStream(
          `${resolve(this.downloadDir)}/${image.name}`,
        );
        response.data.pipe(writter);
        await new Promise((resolve, reject) => {
          writter.on('finish', () => {
            resolve(true);
          });
          writter.on('error', (error) => {
            reject(error);
          });
        });
        await this.updateSuccessMediaDownload(image);
      } else {
        await this.updateFailureMediaDownload(image);
      }
    } catch (error) {
      console.log(error);
      await this.updateFailureMediaDownload(image);
    }

    this.pullNextImageForDownload();
  }
  async updateSuccessMediaDownload(media) {
    await this.prismaService.media.update({
      where: {
        id: media.id,
      },
      data: {
        status: MediaSourceStatusEnum.PROCESSED,
      },
    });
  }
  async updateFailureMediaDownload(media) {
    await this.prismaService.media.update({
      where: {
        id: media.id,
      },
      data: {
        status: MediaSourceStatusEnum.FAILURE,
      },
    });
  }
  async buildDownloadImageJobs() {
    const images = await this.prismaService.media.findMany({
      where: {
        status: MediaSourceStatusEnum.NOT_PROCESSED,
      },
      skip: 1,
      take: this.concurrentImageDownloading,
      orderBy: {
        createdAt: 'asc',
      },
    });
    if (images.length == 0) {
      this.canCheckForAvailableImageDownloadJob = true;
      return;
    }

    this.canCheckForAvailableImageDownloadJob = false;
    await Promise.all(
      images.map(async (image) => {
        await this.prismaService.media.update({
          where: {
            id: image.id,
          },
          data: {
            status: MediaSourceStatusEnum.PROCESSING,
          },
        });
        return this.crawlMediaQueue.add('download-image', image);
      }),
    );
  }

  correctUrl(link: string) {
    if (link.startsWith('//')) {
      return 'https:' + link;
    }
    return link;
  }

  async crawlImagesAndVideos(input: any) {
    try {
      const response = await this.httpService.get(input.url).toPromise();
      if (response.status == 200 || response.status == 201) {
        const mediaRegex = /(<img|<video)[^>]+src="([^">]+)"/g;
        const srcRegex = /src="([^"]*?)"/;

        const media = [];
        let totalImages = 0;
        let totalVideos = 0;
        let isCSR = false;
        let status = MediaSourceStatusEnum.PROCESSING;
        const imagesVideos = response.data.match(mediaRegex);
        if (imagesVideos) {
          imagesVideos.forEach(async (img: string) => {
            const src = srcRegex.exec(img);
            if (!src || src.length < 2) {
              console.log(img, src);
              return;
            }
            const url = this.correctUrl(src[1]);
            const meidaName = url.substring(
              url.lastIndexOf('/') + 1,
              url.indexOf('?') || undefined,
            );
            const mediaType = meidaName.substring(
              meidaName.lastIndexOf('.') + 1,
            );
            const isImage = img.startsWith('<img');
            if (isImage) totalImages++;
            else totalVideos++;
            media.push({
              url: this.correctUrl(src[1]),
              sourceId: input.id,
              name: `${uuidv4()}.${mediaType}`,
              type: isImage ? MediaTypeEnum.IMAGE : MediaTypeEnum.VIDEO,
              path: resolve(this.downloadDir),
            });
          });
        }
        if (media.length > 0) {
          await this.prismaService.media.createMany({
            data: media,
          });
          status = MediaSourceStatusEnum.PROCESSED;
        } else {
          isCSR = true;
          status = MediaSourceStatusEnum.NOT_PROCESSED;
        }
        await this.updateMediaSource({
          ...input,
          totalImages,
          totalVideos,
          isCSR,
          status,
        });
      }
    } catch (err) {
      console.log(err);
      await this.updateMediaSource({
        ...input,
        status: MediaSourceStatusEnum.NOT_PROCESSED,
      });
    }
  }
  async saveFailureMediaSourceResult(code: string, error: any) {
    try {
      await this.prismaService.createMediaSourceResult.update({
        where: {
          code,
        },
        data: {
          status: CreateMediaSourceStatusEnum.ERROR,
          error: error,
        },
      });
    } catch (error) {
      console.log(error);
    }
  }

  async updateMediaSource(mediaSource) {
    try {
      const { id, ...input } = mediaSource;
      await this.prismaService.mediaSource.update({
        where: {
          id,
        },
        data: input,
      });
    } catch (error) {
      console.log(error);
    }
  }

  async saveSuccessMediaSourceResult(code: string) {
    try {
      await this.prismaService.createMediaSourceResult.update({
        where: {
          code,
        },
        data: {
          status: CreateMediaSourceStatusEnum.DONE,
        },
      });
    } catch (error) {
      console.log(error);
    }
  }

  async getImagesVideosFromSrc(mediaSource) {
    try {
      if (mediaSource && mediaSource.length > 0) {
        await Promise.all(
          mediaSource.map((item: any) =>
            this.crawlMediaQueue.add('get-media-source-url', item),
          ),
        );
      }
    } catch (error) {
      console.log(error);
    }
  }

  async bulkCreate(code: string, urls: string[]) {
    let mediaSource: any = null;
    try {
      mediaSource = await this.prismaService.$transaction(
        urls.map((url: string) =>
          this.prismaService.mediaSource.create({
            data: {
              url,
              status: MediaSourceStatusEnum.PROCESSING,
            },
          }),
        ),
      );
      await this.saveSuccessMediaSourceResult(code);
    } catch (error) {
      await this.saveFailureMediaSourceResult(code, error);
    }
    await this.getImagesVideosFromSrc(mediaSource);
  }
}
