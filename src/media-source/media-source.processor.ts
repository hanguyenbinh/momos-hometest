import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { Job, Queue } from 'bullmq';
import { CreateMediaSourceStatusEnum } from 'src/common/enum/create-media-source-status.enum';
import { MediaSourceStatusEnum } from 'src/common/enum/media-source-status.enum';
import { MediaTypeEnum } from 'src/common/enum/media-type.enum';
import { PrismaService } from 'src/prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';
import { resolve } from 'path';
import { createWriteStream, readFileSync, unlinkSync, writeFileSync } from 'fs';
import { isEmpty } from 'class-validator';
import { isImage, isVideo } from 'src/common/file-extension.common';
import { Injectable, Logger } from '@nestjs/common';

import { get as httpsGet } from 'https';
import { CookieJar } from 'tough-cookie';
import { HttpsCookieAgent } from 'http-cookie-agent/http';
import puppeteer from 'puppeteer';

const jar = new CookieJar();
const agent = new HttpsCookieAgent({ cookies: { jar } });

@Processor('crawl-media', { concurrency: 5000 })
@Injectable()
export class MediaSourceProcessor extends WorkerHost {
  private downloadDir: string = './download';
  private concurrentImageDownload: number = 50;
  private concurrentSourceDownload: number = 5000;
  private concurrentParseMediaUrl: number = 200;
  private concurrentParseMediaUrlCSR: number = 1;
  private chromiumPath: string = '';
  constructor(
    private prismaService: PrismaService,
    private configService: ConfigService,
    private readonly logger: Logger,
    @InjectQueue('crawl-media')
    private readonly crawlMediaQueue: Queue,
  ) {
    super();
    this.downloadDir =
      configService.get('server.downloadDir') || this.downloadDir;
    this.concurrentImageDownload =
      configService.get('server.concurrentImageDownload') ||
      this.concurrentImageDownload;
    this.chromiumPath = configService.get('server.chromiumPath');
    this.buildDownloadImageJobs();
    this.crawlMediaQueue.add(
      'build-parse-url-from-source',
      {},
      {
        repeat: {
          // pattern: '*/5 * * * *',
          every: 120 * 1000,
        },
        priority: 30,
      },
    );

    this.crawlMediaQueue.add(
      'check-available-media-source',
      {},
      {
        repeat: {
          // pattern: '*/5 * * * *',
          every: 120 * 1000,
        },
        priority: 29,
      },
    );

    this.crawlMediaQueue.add(
      'build-download-image-jobs',
      {},
      {
        repeat: {
          // pattern: '*/5 * * * *',
          every: 120 * 1000,
        },
        priority: 40,
      },
    );

    this.crawlMediaQueue.add(
      'build-parse-media-url-from-csr-source',
      {},
      {
        repeat: {
          // pattern: '*/5 * * * *',
          every: 60 * 1000,
        },
        priority: 40,
      },
    );
  }
  async process(job: Job<any, any, string>): Promise<any> {
    console.log(job.name);
    switch (job.name) {
      case 'store-media-source':
        this.bulkCreate(job.data.code, job.data.urls);
        break;
      case 'download-page-source':
        this.downloadPageSource(job.data);
        break;
      case 'download-image':
        this.downloadImage(job.data);
        break;
      case 'build-download-image-jobs':
        this.buildDownloadImageJobs();
        break;
      case 'check-available-media-source':
        this.checkForAvailableMediaSource();
        break;
      case 'save-base64-image':
        this.saveBase64Image(job.data);
        break;
      case 'parse-url-from-source':
        this.parseMediaUrlFromSource(job.data);
        break;
      case 'build-parse-url-from-source':
        this.buildParseMediaUrlFromSourceJob();
        break;
      case 'build-parse-media-url-from-csr-source':
        this.buildParseMediaUrlFromCSRSource();
        break;
      case 'parse-url-from-csr-source':
        this.parseMediaUrlFromCSRSource(job.data);
        break;
    }
    return {};
  }
  async parseMediaUrlFromCSRSource(mediaSource) {
    try {
      console.log('mediaSource.url', mediaSource.url);
      let totalImages = 0;
      let totalVideos = 0;

      let status = MediaSourceStatusEnum.DOWNLOADED;
      const browser = await puppeteer.launch({
        executablePath: this.chromiumPath,
        dumpio: true,
        args: [
          "--no-sandbox",
          "--headless",
          "--disable-gpu",
          "--disable-dev-shm-usage",
          mediaSource.url
        ],
      });

      const pages = await browser.pages();
      const page = pages[0];
      console.log('page url', page.url());

      await page.goto(mediaSource.url, {
        timeout: 0,
        waitUntil: 'networkidle2',
      });
      const IMAGE_SELECTOR = 'img, video';

      const result = await page.evaluate((sel) => {
        const urls = [];
        const imageObjs = document.querySelectorAll(sel);
        imageObjs.forEach((item) => {
          urls.push({
            tagName: item.tagName,
            src: item['src'],
          });
        });
        return { urls };
      }, IMAGE_SELECTOR);
      browser.close();
      console.log(result);
      if (result && result.urls && result.urls.length > 0) {
        const mediaFiles = result.urls.map((item) => {
          const url = this.correctUrl(item.src);
          const meidaName = url.substring(
            url.lastIndexOf('/') + 1,
            url.indexOf('?') >= 0 ? url.indexOf('?'): undefined,
          );
          const mediaType = meidaName.substring(meidaName.lastIndexOf('.') + 1);
          const isImage = item.tagName === 'IMG';
          if (isImage) totalImages++;
          else totalVideos++;
          return {
            url,
            sourceId: mediaSource.id,
            name: `${uuidv4()}.${mediaType}`,
            type: isImage ? MediaTypeEnum.IMAGE : MediaTypeEnum.VIDEO,
            path: resolve(this.downloadDir),
          };
        });
        await this.prismaService.media.createMany({
          data: mediaFiles,
        });
        status = MediaSourceStatusEnum.PROCESSED;
        await this.updateMediaSource({
          ...mediaSource,
          totalImages,
          totalVideos,
          status,
        });
        return;
      }
    } catch (error) {
      console.log(error)
      this.logger.error('parseMediaUrlFromCSRSource', error);
    }
    await this.updateMediaSource({
      id: mediaSource.id,
      status: MediaSourceStatusEnum.FAILURE,
    });
  }
  async checkForAvailableMediaSource() {
    try {
      const mediaSource = await this.prismaService.mediaSource.findMany({
        orderBy: {
          createdAt: 'asc',
        },
        skip: 0,
        take: this.concurrentSourceDownload,
        where: {
          status: MediaSourceStatusEnum.NOT_PROCESSED,
        },
      });
      if (mediaSource.length > 0) {
        await this.buildDownloadPageSourceJobs(mediaSource);
      }
    } catch (error) {
      this.logger.error('checkForAvailableMediaSource', error);
    }
  }
  async buildParseMediaUrlFromCSRSource() {
    try {
      const mediaSources = await this.prismaService.mediaSource.findMany({
        orderBy: {
          createdAt: 'asc',
        },
        take: this.concurrentParseMediaUrlCSR,
        where: {
          status: MediaSourceStatusEnum.DOWNLOADED,
          isCSR: true,
        },
      });
      if (mediaSources.length > 0) {
        await Promise.all(
          mediaSources.map((mediaSource: any) => {
            return this.crawlMediaQueue.add(
              'parse-url-from-csr-source',
              mediaSource,
              {
                priority: 50,
              },
            );
          }),
        );
      }
    } catch (error) {
      this.logger.error('buildParseMediaUrlFromCSRSource', error);
    }
  }
  async buildParseMediaUrlFromSourceJob() {
    try {
      const mediaSources = await this.prismaService.mediaSource.findMany({
        orderBy: {
          createdAt: 'asc',
        },
        skip: 0,
        take: this.concurrentParseMediaUrl,
        where: {
          status: MediaSourceStatusEnum.DOWNLOADED,
          NOT: {
            isCSR: true,
          },
        },
      });
      if (mediaSources.length > 0) {
        await Promise.all(
          mediaSources.map((mediaSource: any) => {
            return this.crawlMediaQueue.add(
              'parse-url-from-source',
              mediaSource,
              {
                priority: 40,
              },
            );
          }),
        );
      }
    } catch (error) {
      this.logger.error('buildParseMediaUrlFromSourceJob', error);
    }
  }
  async parseMediaUrlFromSource(mediaSource) {
    try {
      await this.prismaService.mediaSource.update({
        where: {
          id: mediaSource.id,
        },
        data: {
          status: MediaSourceStatusEnum.PROCESSING,
        },
      });
      const data = readFileSync(`./html-source/${mediaSource.id}.html`, 'utf8');
      const mediaRegex = /(<img|<video)[^>]+src="([^">]+)"/g;
      const srcRegex = /src="([^"]*?)"/;

      const mediaFiles = [];
      let totalImages = 0;
      let totalVideos = 0;
      let isCSR = false;
      let status = MediaSourceStatusEnum.DOWNLOADED;
      const imagesVideos = data.match(mediaRegex);
      if (imagesVideos) {
        imagesVideos.forEach((img: string) => {
          const src = srcRegex.exec(img);
          if (!src || src.length < 2) {
            this.logger.warn('downloadPageSource: difference format', img);
            return;
          }
          const url = this.correctUrl(src[1]);
          const meidaName = url.substring(
            url.lastIndexOf('/') + 1,
            url.indexOf('?') >= 0 ? url.indexOf('?'): undefined,
          );
          const mediaType = meidaName.substring(meidaName.lastIndexOf('.') + 1);
          const isImage = img.startsWith('<img');
          if (isImage) totalImages++;
          else totalVideos++;
          mediaFiles.push({
            url: this.correctUrl(src[1]),
            sourceId: mediaSource.id,
            name: `${uuidv4()}.${mediaType}`,
            type: isImage ? MediaTypeEnum.IMAGE : MediaTypeEnum.VIDEO,
            path: resolve(this.downloadDir),
          });
        });
      }
      if (mediaFiles.length > 0) {
        await this.prismaService.media.createMany({
          data: mediaFiles,
        });
        status = MediaSourceStatusEnum.PROCESSED;
        unlinkSync(`./html-source/${mediaSource.id}.html`);
      } else {
        isCSR = true;
      }
      await this.updateMediaSource({
        ...mediaSource,
        totalImages,
        totalVideos,
        isCSR,
        status,
      });
    } catch (error) {
      this.logger.error('parseMediaUrlFromSource', error);
    }
  }
  async pullNextImageForDownload() {
    try {
      const image = await this.prismaService.media.findFirst({
        where: {
          type: MediaTypeEnum.IMAGE,
          status: MediaSourceStatusEnum.NOT_PROCESSED,
        },
        orderBy: {
          createdAt: 'asc',
        },
      });
      if (!image) {
        return;
      }
      await this.prismaService.media.update({
        where: {
          id: image.id,
        },
        data: {
          status: MediaSourceStatusEnum.PROCESSING,
        },
      });
      await this.crawlMediaQueue.add('download-image', image, {
        // removeOnComplete: true,
        // removeOnFail: true,
        priority: 20,
      });
    } catch (error) {
      this.logger.error('pullNextImageForDownload', error);
    }
  }

  async saveBase64Image(image: any) {
    try {
      const base64Data = image.url.split(';base64,');
      const fileExt = base64Data[0]
        .replace('data:image/', '')
        .substring(0, base64Data[0].indexOf('+') || undefined);
      const base64Image = base64Data[1];
      const path = image.path;
      const fileName = `${uuidv4()}.${fileExt}`;
      writeFileSync(`${path}/${fileName}`, base64Image, { encoding: 'base64' });
      await this.prismaService.media.update({
        where: {
          id: image.id,
        },
        data: {
          name: fileName,
          status: MediaSourceStatusEnum.PROCESSED,
        },
      });
    } catch (error) {
      this.logger.error('saveBase64Image', error);
    }
  }
  async downloadImage(image: any) {
    try {
      if (image.url.startsWith('data:image/')) {
        await this.saveBase64Image(image);
      } else {
        const writter = createWriteStream(
          `${resolve(this.downloadDir)}/${image.name}`,
        );
        const downloadFile = await new Promise((resolve, reject) => {
          const request = httpsGet(image.url, { agent }, (res) => {
            res.pipe(writter);
            writter.on('finish', () => {
              resolve(true);
            });
          });
          request.end();
          request.on('error', (err) => {
            reject(err);
          });
        });
        if (downloadFile) {
          await this.updateSuccessMediaDownload(image);
        } else {
          await this.updateFailureMediaDownload(image);
        }
      }
    } catch (error) {
      this.logger.error('downloadImage', error);
      await this.updateFailureMediaDownload(image);
    }
  }
  async updateSuccessMediaDownload(media) {
    try {
      await this.prismaService.media.update({
        where: {
          id: media.id,
        },
        data: {
          status: MediaSourceStatusEnum.PROCESSED,
        },
      });
    } catch (error) {
      this.logger.error('updateSuccessMediaDownload', error);
    }
  }
  async updateFailureMediaDownload(media) {
    try {
      await this.prismaService.media.update({
        where: {
          id: media.id,
        },
        data: {
          status: MediaSourceStatusEnum.FAILURE,
        },
      });
    } catch (error) {
      this.logger.error('updateFailureMediaDownload', error);
    }
  }
  async buildDownloadImageJobs() {
    try {
      const images = await this.prismaService.media.findMany({
        where: {
          type: MediaTypeEnum.IMAGE,
          status: MediaSourceStatusEnum.NOT_PROCESSED,
        },
        skip: 0,
        take: this.concurrentImageDownload,
        orderBy: {
          createdAt: 'asc',
        },
      });
      if (images.length == 0) {
        return;
      }

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
          return this.crawlMediaQueue.add('download-image', image, {
            priority: 20,
          });
        }),
      );
    } catch (error) {
      this.logger.error('buildDownloadImageJobs', error);
    }
  }

  correctUrl(link: string) {
    if (link.startsWith('//')) {
      return 'https:' + link;
    }
    return link;
  }

  async downloadPageSource(input: any) {
    try {
      console.log('start downloadPageSource', input.url);
      const writter = createWriteStream(
        `${resolve('./html-source')}/${input.id}.html`,
      );
      const saveFile = await new Promise((resolve, reject) => {
        const response = httpsGet(
          input.url,
          {
            timeout: 10000,
            agent,
          },
          (res) => {
            // res.pipe(new Throttle({ rate: 2000 * 1024 })).pipe(writter);
            res.pipe(writter);
            // res.on('end', () => {
            //   console.log('Done! Elapsed time: ' + (Date.now() - time) + 'ms');
            // });
            // writter.on('close', () => {
            //   console.log('stream close', filename, Date.now() - time + 'ms');
            // });
            writter.on('finish', () => {
              resolve(true);
            });
          },
        );
        response.end();
        response.on('error', (err: any) => {
          this.logger.error('downloadPageSource', err);
          reject(err);
        });
      });
      if (saveFile) {
        await this.updateMediaSource({
          ...input,
          totalImages: 0,
          totalVideos: 0,
          isCSR: false,
          status: MediaSourceStatusEnum.DOWNLOADED,
        });
      }
    } catch (err) {
      let status = MediaSourceStatusEnum.FAILURE;
      if (err.code == 'ECONNRESET' || err.code == 'ETIMEDOUT') {
        status = MediaSourceStatusEnum.NOT_PROCESSED;
      }
      await this.updateMediaSource({
        ...input,
        status,
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
      this.logger.error('saveFailureMediaSourceResult', error);
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
      this.logger.error('updateMediaSource', error);
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
      this.logger.error('saveSuccessMediaSourceResult', error);
    }
  }

  async buildDownloadPageSourceJobs(mediaSource) {
    try {
      if (mediaSource && mediaSource.length > 0) {
        await this.prismaService.$transaction(
          mediaSource.map((item) =>
            this.prismaService.mediaSource.update({
              where: {
                id: item.id,
              },
              data: {
                status: MediaSourceStatusEnum.PROCESSING,
              },
            }),
          ),
        );
        await Promise.all(
          mediaSource.map((item: any) => {
            return this.crawlMediaQueue.add('download-page-source', item, {
              // removeOnComplete: true,
              // removeOnFail: true,
              priority: 10,
            });
          }),
        );
      }
    } catch (error) {
      this.logger.error('buildDownloadPageSourceJobs', error);
    }
  }
  isMediaLink(url: string) {
    const fileName = url.substring(
      url.lastIndexOf('/'),
      url.indexOf('?') >= 0 ? url.indexOf('?'): undefined,
    );
    const fileExt = fileName.substring(fileName.lastIndexOf('.') + 1);
    if (isEmpty(fileExt)) return true;
    return {
      isMedia: isImage[fileExt] || isVideo[fileExt],
      isImage: isImage[fileExt] || false,
      isVideo: isVideo[fileExt] || false,
      ext: fileExt,
    };
  }

  async bulkCreate(code: string, urls: string[]) {
    // let mediaSource: any = null;
    try {
      await this.prismaService.$transaction(
        urls.map((url: string) => {
          return this.prismaService.mediaSource.create({
            data: {
              url,
              status: MediaSourceStatusEnum.NOT_PROCESSED,
            },
          });
        }),
      );
      await this.saveSuccessMediaSourceResult(code);
    } catch (error) {
      await this.saveFailureMediaSourceResult(code, error);
    }
  }
}
