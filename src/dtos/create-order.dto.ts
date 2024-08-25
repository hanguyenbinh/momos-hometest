import { ApiProperty } from '@nestjs/swagger';
import { BaseDto } from './base.dto';
import { IsArray, IsNotEmpty, IsPositive, Min } from 'class-validator';


export class CreateBodyRecordDto extends BaseDto {
  @ApiProperty({
    example: 1,
    description: 'customer id, can not be null'
  })
  @IsNotEmpty()
  @IsPositive()
  @Min(1)
  customerId: number

  @ApiProperty({
    example: [1,2,3],
    description: 'goods id array, min size = 1'
  })
  @IsArray()
  items: number[];
}
