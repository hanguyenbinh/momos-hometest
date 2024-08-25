import { ApiProperty } from '@nestjs/swagger';
import {  
  IsNotEmpty,  
  Matches,
} from 'class-validator';
import { BaseDto } from './base.dto';

export class CreateCustomerDto extends BaseDto {
  @ApiProperty({
    example: 'hanguyenbinh201282@gmail.com',
    description: 'customer email',
  })
  @IsNotEmpty({message: 'EMAIL_IS_REQUIRED'})
  @Matches('/^[a-zA-Z0-9@]{6,20}$/')
  email: string;

  @ApiProperty({ example: 'Binh', description: 'customer name' })
  @IsNotEmpty({message: 'CUSTOMER_NAME_IS_REQUIRED'})
  name: string;

  @ApiProperty({ example: '0934008160', description: 'customer phone' })
  @IsNotEmpty({message: 'CUSTOMER_PHONE_IS_REQUIRED'})
  @Matches(/([0|3|5|7|8|9])+([0-9]{8})\b/g)
  phone: string;
}
