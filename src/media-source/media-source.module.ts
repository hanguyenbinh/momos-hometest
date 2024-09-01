import { Module } from '@nestjs/common';
import { MediaSourceService } from './media-source.service';
import { MediaSourceController } from './media-source.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { BullModule } from '@nestjs/bullmq';
import { MediaSourceProcessor } from './media-source.processor';
import { HttpModule } from '@nestjs/axios';
import { ImageDownloadProcessor } from './image-download.processor';

@Module({
  imports: [
    PrismaModule,
    HttpModule,
    BullModule.registerQueue(
      {
        name: 'crawl-media',
      },
      {
        name: 'download-image',
      },
    ),
  ],
  providers: [MediaSourceService, MediaSourceProcessor, ImageDownloadProcessor],
  controllers: [MediaSourceController],
})
export class MediaSourceModule {}
