import { Body, Controller, Post } from '@nestjs/common';
import { MediaSourceService } from './media-source.service';
import { CreateMediaSourceDto } from 'src/dtos/create-media-source.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@Controller('media-source')
@ApiTags('Media Source')
@ApiBearerAuth()
export class MediaSourceController {
  constructor(private service: MediaSourceService) {}

  @Post()
  async create(@Body() input: CreateMediaSourceDto) {
    return this.service.create(input);
  }
}
