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

@Processor('download-image', { concurrency: 10 })
export class ImageDownloadProcessor extends WorkerHost {
  private downloadDir: string = './download';
  constructor(
    private prismaService: PrismaService,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @InjectQueue('download-image')
    private readonly crawlMediaQueue: Queue,
  ) {
    super();
    this.downloadDir =
      configService.get('server.downloadDir') || this.downloadDir;
  }
  async process(job: Job<any, any, string>): Promise<any> {
    return {};
  }
}
