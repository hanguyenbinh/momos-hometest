import { Body, Controller, Get, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
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
  @ApiQuery({ name: 'email', required: false, type: String, example: 'abc' })
  @ApiQuery({ name: 'order', required: false, type: String, example: '' })    
  @ApiQuery({ name: 'sort', required: false, type: String, example: 'asc'})    
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
    async getUsers(
        @Query('email') email: string,
        @Query('order') order: string,
        @Query('sort') sort: string,
        @Query('page') page: number,
        @Query('limit') limit: number){
    return this.authService.getUsers({
      email,
      order,
      sort,
      page,
      limit
    });
  }
  @Get('me')
  async getCurrentUser(@CurrentUser() user){
    return this.authService.getUser(user.id);
  }

  @Get(':id')
  async getUser(@Param('id', ParseIntPipe) id: number){
    return this.authService.getUser(id);
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
