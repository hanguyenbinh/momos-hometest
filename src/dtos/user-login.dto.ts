import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsPositive, Matches } from 'class-validator';

export class UserLoginDto {
  @ApiProperty({
    example: 'hanguyenbinh201282@gmail.com',
    description: 'unique, used to login',
  })
  @IsNotEmpty({message: 'EMAIL_IS_REQUIRED'})
  @Matches('/^[a-zA-Z0-9@]{6,20}$/')
  email: string;

  @ApiProperty({ example: '123456', description: 'password used to login' })
  @IsNotEmpty({message: 'PASSWORD_IS_REQUIRED'})
  password: string;
}
