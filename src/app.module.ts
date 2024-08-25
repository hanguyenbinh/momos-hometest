import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import configuration from './config/configuration';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from './auth/auth.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [configuration],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const typeormConfig = configService.get('database');
        if (process.env.POSTGRESQL_HOST) {
          typeormConfig.host = process.env.POSTGRESQL_HOST;
        }
        if (process.env.POSTGRESQL_PORT) {
          typeormConfig.port = process.env.POSTGRESQL_PORT;
        }
        if (process.env.POSTGRESQL_USER) {
          typeormConfig.username = process.env.POSTGRESQL_USER;
        }
        if (process.env.POSTGRESQL_PASSWORD) {
          typeormConfig.password = process.env.POSTGRESQL_PASSWORD;
        }
        if (process.env.POSTGRESQL_DATABASE) {
          typeormConfig.database = process.env.POSTGRESQL_DATABASE;
        }
        console.log(typeormConfig)
        return typeormConfig;
      },
    }),
    AuthModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
