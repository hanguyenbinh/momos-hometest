import { ApiProperty } from '@nestjs/swagger';
import { BaseDto } from './base.dto';
import { IsArray, IsNotEmpty, IsPositive, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { Decimal } from '@prisma/client/runtime';

class OrderItemInterface {
  id: number
  quantity: number
  price: Decimal;
}

export class CreateOrderDto extends BaseDto {
  @ApiProperty({
    example: 1,
    description: 'customer id, can not be null'
  })
  @IsNotEmpty()
  @IsPositive()
  @Min(1)
  customerId: number

  @ApiProperty({
    example: [{id: 1, quantity: 1},{id: 2, quantity: 2}],
    description: 'goods id array, min size = 1'
  })
  @IsArray()
  @Type(()=> OrderItemInterface)
  items: OrderItemInterface[];
}
