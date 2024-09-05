import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { MediaSourceService } from './media-source.service';
import { CreateMediaSourceDto } from 'src/dtos/create-media-source.dto';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { MediaSourceStatusEnum } from 'src/common/enum/media-source-status.enum';

@Controller('media-sources')
@ApiTags('Media Source')
@ApiBearerAuth()
export class MediaSourceController {
  constructor(private service: MediaSourceService) {}

  @Get()
  @ApiQuery({
    name: 'url',
    required: false,
    type: String,
    example: 'google.com',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: MediaSourceStatusEnum,
    example: MediaSourceStatusEnum.NOT_PROCESSED,
  })
  @ApiQuery({ name: 'isCSR', required: false, type: Boolean, example: false })
  @ApiQuery({ name: 'order', required: false, type: String, example: '' })
  @ApiQuery({ name: 'sort', required: false, type: String, example: '' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getMediaSources(
    @Query('url') url: string = '',
    @Query('status') status: MediaSourceStatusEnum,
    @Query('isCSR') isCSR: boolean = false,
    @Query('order') order: string = '',
    @Query('sort') sort: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.service.getMediaSources({
      url,
      status,
      isCSR,
      order,
      sort,
      page,
      limit,
    });
  }

  @Get('/create-media-resource-status/:code')
  async getCreateMediaResourceStatus(
    @Param('code', new ParseUUIDPipe({ version: '4' })) code: string,
  ) {
    return this.service.getCreateMediaResourceStatus(code);
  }

  @Get('/images')
  @ApiQuery({
    name: 'url',
    required: false,
    type: String,
    example: 'google.com',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: MediaSourceStatusEnum,
    example: MediaSourceStatusEnum.NOT_PROCESSED,
  })
  @ApiQuery({ name: 'sourceId', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'order', required: false, type: String, example: '' })
  @ApiQuery({ name: 'sort', required: false, type: String, example: '' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getImages(
    @Query('url') url: string = '',
    @Query('status') status: MediaSourceStatusEnum,
    @Query('sourceId') sourceId: number,
    @Query('order') order: string,
    @Query('sort') sort: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.service.getImages({
      url,
      status,
      sourceId,
      order,
      sort,
      page,
      limit,
    });
  }

  @Get('/videos')
  @ApiQuery({
    name: 'url',
    required: false,
    type: String,
    example: 'google.com',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: MediaSourceStatusEnum,
    example: MediaSourceStatusEnum.NOT_PROCESSED,
  })
  @ApiQuery({ name: 'sourceId', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'order', required: false, type: String, example: '' })
  @ApiQuery({ name: 'sort', required: false, type: String, example: '' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getVideos(
    @Query('url') url: string = '',
    @Query('status') status: MediaSourceStatusEnum,
    @Query('sourceId') sourceId: number,
    @Query('order') order: string,
    @Query('sort') sort: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.service.getVideos({
      url,
      status,
      sourceId,
      order,
      sort,
      page,
      limit,
    });
  }

  @Post()
  async create(@Body() input: CreateMediaSourceDto) {
    return this.service.create(input);
  }
}
