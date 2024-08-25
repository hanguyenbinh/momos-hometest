import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';

import { AuthModule } from './auth/auth.module';
import { GoodsModule } from './goods/goods.module';
import { OrderService } from './order/order.service';
import { OrderModule } from './order/order.module';
import { PrismaModule } from './prisma/prisma.module';
import { CustomerModule } from './customer/customer.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [configuration],
    }),    
    AuthModule,
    GoodsModule,
    OrderModule,
    PrismaModule,
    CustomerModule
  ],
  controllers: [AppController],
  providers: [AppService, OrderService],
})
export class AppModule {}
