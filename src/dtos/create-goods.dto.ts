import { ApiProperty } from '@nestjs/swagger';
import { BaseDto } from './base.dto';
import { IsNotEmpty, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateBodyRecordDto extends BaseDto {
  @ApiProperty({
    example: "bicycle",
    description: 'can not be null'
  })
  @IsNotEmpty()
  name: string

  @ApiProperty({
    example: 0,
    description: 'quantity'
  })
  @IsNotEmpty()
  @IsPositive()
  @Type(() => Number)
  quantity: number;
}
