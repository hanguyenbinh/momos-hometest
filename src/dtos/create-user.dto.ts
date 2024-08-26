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
  email: string;

  @ApiProperty({ example: '123456', description: 'password used to login' })
  @IsNotEmpty({message: 'PASSWORD_IS_REQUIRED'})
  password: string;

  @ApiProperty({ example: '123456', description: 'firstname' })
  @IsNotEmpty({message: 'FIRST_NAME_IS_REQUIRED'})
  firstName: string;

  @ApiProperty({ example: '123456', description: 'lastname' })
  @IsNotEmpty({message: 'LAST_NAME_IS_REQUIRED'})
  lastName: string;
}
