import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsNumber,
  Matches,
} from 'class-validator';
import { BaseDto } from './base.dto';

export class CreateUserDto extends BaseDto {
  @ApiProperty({
    example: 'hanguyenbinh201282@gmail.com',
    description: 'unique, email is used to login',
  })
  @IsNotEmpty({message: 'EMAIL_IS_REQUIRED'})
  @Matches('/^[a-zA-Z0-9@]{6,20}$/')
  email: string;

  @ApiProperty({ example: '123456', description: 'password used to login' })
  @IsNotEmpty({message: 'PASSWORD_IS_REQUIRED'})
  password: string;
}
