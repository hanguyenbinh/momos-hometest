import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { HttpResult } from 'src/common/http/http-result.http';
import {  
  Repository,
} from 'typeorm';
import * as bcrypt from 'bcryptjs';

import { isArray } from 'class-validator';
import { UserEntity } from 'src/entities/user.entity';
import { UserLoginDto } from 'src/dtos/user-login.dto';
import { CreateUserDto } from 'src/dtos/create-user.dto';



@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private logger: Logger,

    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) { }

  async register(input: CreateUserDto) {
    const user = await this.userRepository.findOne({
      where: {
        email: input.email,
      },
    });
    if (user) {
      return new HttpResult({
        status: false,
        message: 'EMAIL_IS_ALREADY_USED',
      });
    }
    input.createdAt = new Date();
    const newUser = this.userRepository.create(input);
    const result = await this.userRepository.save(newUser);

    return new HttpResult({
      message: 'REGISTER_SUCCESS',
      data: result,
    });
  }

  async login(input: UserLoginDto) {
    const user = await this.userRepository.findOne(
      {
        where: { email: input.email },
        select: ['id', 'email', 'password'],
      }

    )
    if (!user) {
      return new HttpResult({
        status: false,
        message: 'USER_NOT_FOUND',
      });
    }
    const isPasswordValid = bcrypt.compareSync(input.password, user.password);
    if (!isPasswordValid) {
      return new HttpResult({
        status: false,
        message: 'INVALID_PASSWORD',
      });
    }
    const payload = {
      userId: user.id,
      userEmail: user.email
    };
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('jwt.signOptions.expiresIn')
    });
    return new HttpResult({
      data: {
        userId: user.id,
        userEmail: user.email,
        accessToken,
      },
      message: 'LOGIN_SUCCESS',
    });
  }


  async validateToken(token: string) {
    try {
      const isValid = this.jwtService.verify(token);
      if (!isValid) {
        return new HttpResult({
          status: false,
          message: 'INVALID_TOKEN',
        });
      }
      return new HttpResult({
        message: 'TOKEN_VALIDATED',
        data: {
          isValid: true,
        },
      });
    } catch (error) {
      this.logger.error(error);
      return new HttpResult({
        status: false,
        message: 'INVALID_TOKEN',
      });
    }
  }

  async validate(id: number) {

    try {
      const user: any = await this.userRepository.findOne({
        where: { id },
        select: ['id', 'email', 'password'],
      }
      );

      if (!user) {
        return null;
      }
      return user;
    } catch (error) {
      this.logger.error(error);
    }

    return null;
  }
}
