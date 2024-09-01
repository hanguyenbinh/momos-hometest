import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { HttpResult } from 'src/common/http/http-result.http';
import * as bcrypt from 'bcryptjs';
import { UserLoginDto } from 'src/dtos/user-login.dto';
import { CreateUserDto } from 'src/dtos/create-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import * as moment from 'moment';
import { FiltersInterface } from 'src/common/interface/filters.interface';
import { isNotEmpty } from 'class-validator';
interface UserFilters extends FiltersInterface {
  email: string;
}

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private logger: Logger,

    private prismaService: PrismaService,
  ) {}
  async getUsers(filters: UserFilters) {
    console.log(filters);
    const take = !Number.isNaN(filters.limit) ? filters.limit : 10;
    const skip =
      ((!Number.isNaN(filters.page) || filters.page > 0 ? filters.page : 1) -
        1) *
      take;
    const orderBy = {};
    const where: any = {};
    if (filters.order) {
      orderBy[filters.order] = 'asc' == filters.sort ? 'asc' : 'desc';
    }
    if (isNotEmpty(filters.email)) {
      where.email = {
        contains: filters.email,
      };
    }
    const [users, count] = await this.prismaService.$transaction([
      this.prismaService.user.findMany({
        skip,
        take,
        orderBy,
        where,
      }),
      this.prismaService.user.count(),
    ]);

    const hasNextPage = count / take > filters.page;
    return new HttpResult({
      message: 'GET_USERS_SUCCESS',
      data: { users, count, hasNextPage },
    });
  }
  async getUser(id: number) {
    const user = await this.prismaService.user.findUnique({
      where: {
        id,
      },
    });
    if (!user) {
      return new HttpResult({
        status: false,
        message: 'USER_IS_NOT_EXIST',
      });
    }
    return new HttpResult({
      message: 'GET_USER_SUCCESS',
      data: { user },
    });
  }

  async register(input: CreateUserDto) {
    const user = await this.prismaService.user.findUnique({
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
    input.password = await bcrypt.hash(input.password, 10);
    const result = await this.prismaService.user.create({ data: input });

    return new HttpResult({
      message: 'REGISTER_SUCCESS',
      data: result,
    });
  }

  async login(input: UserLoginDto) {
    const user = await this.prismaService.user.findUnique({
      where: { email: input.email },
      select: {
        id: true,
        email: true,
        password: true,
      },
    });
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
      userEmail: user.email,
    };
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('jwt.signOptions.expiresIn'),
    });
    const expired = moment().add(7, 'days').valueOf();
    return new HttpResult({
      data: {
        user: {
          id: user.id,
          email: user.email,
        },
        token: accessToken,
        tokenExpires: expired,
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
      const user: any = await this.prismaService.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          password: true,
        },
      });

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
