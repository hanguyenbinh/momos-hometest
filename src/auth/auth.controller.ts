import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { HttpResult } from 'src/common/http/http-result.http';
import { AuthService } from './auth.service';
import { AllowUnauthorized } from './decorator/allow-unauthorized.decorator';
import { UserLoginDto } from 'src/dtos/user-login.dto';
import { CreateUserDto } from 'src/dtos/create-user.dto';

@Controller('auth')
@ApiTags('AUTH')
@ApiBearerAuth()
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @Get()
  async getUsers(){
    return this.authService.getUsers();
  }
  @Get('current-user')
  async getCurrentUser(@CurrentUser() user){
    return new HttpResult({
      status: true,
      data: {...user, password: null}
    });
  }
  @AllowUnauthorized()
  @Get('validate-token')  
  @ApiQuery({ name: 'token', required: true, type: String })
  async validateToken(
    @Query('token') token: string,
  ) {
    return this.authService.validateToken(token);
  }
  
  @AllowUnauthorized()
  @Post('login')  
  async login(@Body() input: UserLoginDto) {
    return this.authService.login(input);
  }

  @AllowUnauthorized()
  @Post('register')
  async register(@Body() input: CreateUserDto){
    return this.authService.register(input);
  }
}
