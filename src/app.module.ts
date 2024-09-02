import { Logger, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import configuration from './config/configuration';

import { AuthModule } from './auth/auth.module';

import { PrismaModule } from './prisma/prisma.module';

import { MediaSourceModule } from './media-source/media-source.module';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [configuration],
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        connection: {
          host: process.env.REDIS_HOST
            ? process.env.REDIS_HOST
            : configService.get('redis.host'),
          port: +(process.env.REDIS_PORT
            ? process.env.REDIS_PORT
            : configService.get('redis.port')),
          password: process.env.REDIS_PASSWORD
            ? process.env.REDIS_PASSWORD
            : configService.get('redis.password'),
        },
      }),
      inject: [ConfigService],
    }),
    PrismaModule,
    AuthModule,
    MediaSourceModule,
  ],
  controllers: [AppController],
  providers: [AppService, Logger],
})
export class AppModule {}
