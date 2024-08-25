import { ApiProperty } from '@nestjs/swagger';
import { BaseDto } from './base.dto';
import { IsDecimal, IsNotEmpty, IsNumber, IsPositive } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class CreateGoodsDto extends BaseDto {
  @ApiProperty({
    example: "bicycle",
    description: 'can not be null'
  })
  @IsNotEmpty()
  name: string

  @ApiProperty({
    example: 1,
    description: 'quantity'
  })
  @IsNotEmpty()
  @IsPositive()
  @Type(() => Number)
  quantity: number;

  @ApiProperty({
    example: 0.00,
    description: 'price'
  })
  @IsNotEmpty()
  @IsDecimal({decimal_digits: '2', force_decimal: true})
  @Type(() => Number)
  @Transform((value)=>{
    const newVal = parseFloat(value.value).toFixed(2);
    return newVal
  })
  unitPrice: number;
}
