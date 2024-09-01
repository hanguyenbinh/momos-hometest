import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsUrl } from 'class-validator';
import { BaseDto } from './base.dto';
import { Type } from 'class-transformer';

const exampleUrls = Array(200).fill(
  'https://www.mykingdom.com.vn/collections/lego?srsltid=AfmBOopvRtqdhAo2zNQ3OoEH_LqswGwagubwXzMWXMrZItx2vyIYaGoO',
);

// const exampleUrls = Array(5000).fill('http://localhost:5000');

export class CreateMediaSourceDto extends BaseDto {
  @ApiProperty({
    example: exampleUrls,
    description: 'customer email',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(5001)
  @IsUrl({ require_valid_protocol: false }, { each: true })
  @Type(() => String)
  urls: string[];
}
