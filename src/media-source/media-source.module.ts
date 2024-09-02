import { Logger, Module } from '@nestjs/common';
import { MediaSourceService } from './media-source.service';
import { MediaSourceController } from './media-source.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { BullModule } from '@nestjs/bullmq';
import { MediaSourceProcessor } from './media-source.processor';
import { HttpModule } from '@nestjs/axios';
import { ImageDownloadProcessor } from './image-download.processor';
import { Agent } from 'https';

@Module({
  imports: [
    PrismaModule,
    HttpModule.register({
      httpsAgent: new Agent({
        rejectUnauthorized: false,
        keepAlive: true,
      }),
      timeout: 2000,
    }),
    BullModule.registerQueue(
      {
        name: 'crawl-media',
      },
      {
        name: 'download-image',
      },
    ),
  ],
  providers: [
    MediaSourceService,
    MediaSourceProcessor,
    ImageDownloadProcessor,
    Logger,
  ],
  controllers: [MediaSourceController],
})
export class MediaSourceModule {}
