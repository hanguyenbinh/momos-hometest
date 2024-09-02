import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { MediaType } from '@prisma/client';
import { Queue } from 'bullmq';
import { isNotEmpty } from 'class-validator';
import { CreateMediaSourceStatusEnum } from 'src/common/enum/create-media-source-status.enum';
import { MediaSourceStatusEnum } from 'src/common/enum/media-source-status.enum';
import { HttpResult } from 'src/common/http/http-result.http';
import { FiltersInterface } from 'src/common/interface/filters.interface';
import { CreateMediaSourceDto } from 'src/dtos/create-media-source.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';

interface MediaSourceFilters extends FiltersInterface {
  url: string;
  status: MediaSourceStatusEnum;
  isCSR: boolean;
}

interface MediaFilters extends FiltersInterface {
  url: string;
  status: MediaSourceStatusEnum;
  sourceId: number;
}
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
    await this.crawlMediaQueue.add(
      'store-media-source',
      {
        urls: input.urls,
        code,
      },
      {
        priority: 5,
      },
    );

    return new HttpResult({
      message: 'MEDIA_SOURCE_IS_CREATED',
      data: createMediaSourceJob,
    });
  }

  async getMediaSources(filters: MediaSourceFilters) {
    const take = !Number.isNaN(filters.limit) ? filters.limit : 10;
    const skip =
      ((!Number.isNaN(filters.page) || filters.page > 0 ? filters.page : 1) -
        1) *
      take;
    const orderBy = {};
    const where: any = {};
    if (filters.order) {
      orderBy[filters.order] = 'asc' == filters.sort ? 'asc' : 'desc';
    }
    if (isNotEmpty(filters.url)) {
      where.name = {
        contains: filters.url,
      };
    }
    if (isNotEmpty(filters.status)) {
      where.status = filters.status;
    }

    if (isNotEmpty(filters.isCSR)) {
      where.isCSR = filters.isCSR;
    }

    const [mediaSources, count] = await this.prismaService.$transaction([
      this.prismaService.mediaSource.findMany({
        skip,
        take,
        orderBy,
        where,
      }),
      this.prismaService.mediaSource.count(),
    ]);
    const hasNextPage = count / take > filters.page;
    return new HttpResult({
      message: 'GET_MEDIA_SOURCES_SUCCESS',
      data: { mediaSources, count, hasNextPage },
    });
  }

  async getMediaSource(id: number) {
    const mediaSource = await this.prismaService.mediaSource.findUnique({
      where: {
        id,
      },
    });
    if (!mediaSource)
      return new HttpResult({
        status: false,
        message: 'MEDIA_SOURCE_NOT_FOUND',
      });
    return new HttpResult({
      message: 'GET_MEDIA_SOURCE_SUCCESS',
      data: { mediaSource },
    });
  }

  async getImages(filters: MediaFilters) {
    const take = !Number.isNaN(filters.limit) ? filters.limit : 10;
    const skip =
      ((!Number.isNaN(filters.page) || filters.page > 0 ? filters.page : 1) -
        1) *
      take;
    const orderBy = {};
    const where: any = {
      type: MediaType.IMAGE,
    };
    if (filters.order) {
      orderBy[filters.order] = 0 == filters.sort ? 'asc' : 'desc';
    }
    if (isNotEmpty(filters.url)) {
      where.name = {
        contains: filters.url,
      };
    }
    if (isNotEmpty(filters.status)) {
      where.status = filters.status;
    }

    if (isNotEmpty(filters.sourceId) && !isNaN(filters.sourceId)) {
      where.sourceId = filters.sourceId;
    }

    const [images, count] = await this.prismaService.$transaction([
      this.prismaService.media.findMany({
        include: {
          source: true,
        },
        skip,
        take,
        orderBy,
        where,
      }),
      this.prismaService.media.count({
        where: {
          type: MediaType.IMAGE,
        },
      }),
    ]);
    const hasNextPage = count / take > filters.page;

    return new HttpResult({
      message: 'GET_IMAGE_SUCCESS',
      data: { images, count, hasNextPage },
    });
  }
  async getVideos(filters: MediaFilters) {
    const take = !Number.isNaN(filters.limit) ? filters.limit : 10;
    const skip =
      ((!Number.isNaN(filters.page) || filters.page > 0 ? filters.page : 1) -
        1) *
      take;
    const orderBy = {};
    const where: any = {
      type: MediaType.VIDEO,
    };
    if (filters.order) {
      orderBy[filters.order] = 0 == filters.sort ? 'asc' : 'desc';
    }
    if (isNotEmpty(filters.url)) {
      where.name = {
        contains: filters.url,
      };
    }
    if (isNotEmpty(filters.status)) {
      where.status = filters.status;
    }

    if (isNotEmpty(filters.sourceId) && !isNaN(filters.sourceId)) {
      where.sourceId = filters.sourceId;
    }
    const [videos, count] = await this.prismaService.$transaction([
      this.prismaService.media.findMany({
        include: {
          source: true,
        },
        skip,
        take,
        orderBy,
        where,
      }),
      this.prismaService.media.count({
        where: {
          type: MediaType.VIDEO,
        },
      }),
    ]);
    const hasNextPage = count / take > filters.page;

    return new HttpResult({
      message: 'GET_VIDEOS_SUCCESS',
      data: { videos, count, hasNextPage },
    });
  }
}
