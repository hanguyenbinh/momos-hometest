import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { CreateMediaSourceStatusEnum } from 'src/common/enum/create-media-source-status.enum';
import { HttpResult } from 'src/common/http/http-result.http';
import { CreateMediaSourceDto } from 'src/dtos/create-media-source.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class MediaSourceService {
  constructor(
    private prismaService: PrismaService,
    @InjectQueue('crawl-media')
    private readonly crawlMediaQueue: Queue,
  ) {}

  async create(input: CreateMediaSourceDto) {
    const code = uuidv4();
    const createMediaSourceJob =
      await this.prismaService.createMediaSourceResult.create({
        data: {
          code,
          status: CreateMediaSourceStatusEnum.PROCESSING,
        },
      });
    await this.crawlMediaQueue.add('store-media-source', {
      urls: input.urls,
      code,
    });
    // Promise.all(
    //   mediaSource.map((item) =>
    //     this.crawlMediaQueue.add('get-media-source-url', {
    //       input: item,
    //     }),
    //   ),
    // );

    return new HttpResult({
      message: 'MEDIA_SOURCE_IS_CREATED',
      data: createMediaSourceJob,
    });
  }
}
