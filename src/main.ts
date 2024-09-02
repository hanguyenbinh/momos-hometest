import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/exception-filters/all-exception.filter';
import { JwtAuthGuard } from './auth/guard/jwt-auth.guard';
import configuration from './config/configuration';
import helmet from 'helmet';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationError, useContainer } from 'class-validator';
import { ValidationPipe } from '@nestjs/common';
import { iterate } from 'iterare';
import { mapChildrenToValidationErrors } from './common/utils/validation.utils';
import { InvalidInputException } from './common/exceptions/invalid-input.exception';
import * as bodyParser from 'body-parser';
import { WinstonModule } from 'nest-winston';
import { format, transports } from 'winston';
import 'winston-daily-rotate-file';
async function bootstrap() {
  const appConfig = configuration() as any;
  const typeormConfig = appConfig.database;
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
  process.env['DATABASE_URL'] =
    `postgres://${typeormConfig.username}:${typeormConfig.password}@${typeormConfig.host}:${typeormConfig.port}/${typeormConfig.database}`;

  const logDir = appConfig.server.logDir;

  const logger = WinstonModule.createLogger({
    transports: [
      // file on daily rotation (error only)
      new transports.DailyRotateFile({
        // %DATE will be replaced by the current date
        filename: `${logDir}/%DATE%-error.log`,
        level: 'error',
        format: format.combine(format.timestamp(), format.json()),
        datePattern: 'YYYY-MM-DD',
        zippedArchive: false, // don't want to zip our logs
        maxFiles: '2d', // will keep log until they are older than 30 days,
        maxSize: '10m',
      }),
      // same for all levels
      new transports.DailyRotateFile({
        filename: `${logDir}/%DATE%-combined.log`,
        format: format.combine(format.timestamp(), format.json()),
        datePattern: 'YYYY-MM-DD',
        zippedArchive: false,
        maxFiles: '2d',
        maxSize: '10m',
      }),
      new transports.Console({
        format: format.combine(
          format.cli(),
          format.splat(),
          format.timestamp(),
          format.printf((info) => {
            return `${info.timestamp} ${info.level}: ${info.message}`;
          }),
        ),
      }),
    ],
  });

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger,
  });
  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      // disableErrorMessages: true,
      exceptionFactory: (validationErrors: ValidationError[] = []) => {
        const errors = iterate(validationErrors)
          .map((error) => mapChildrenToValidationErrors(error))
          .flatten()
          .filter((item) => !!item.constraints)
          .map((item) => Object.values(item.constraints))
          .flatten()
          .toArray();
        return new InvalidInputException(
          errors.length > 0 ? (errors[0] as string) : '',
        );
      },
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
  app.enableCors();
  const reflector = app.get(Reflector);
  app.useGlobalGuards(new JwtAuthGuard(reflector, appConfig));
  if (appConfig.server.enableOpenAPI === true) {
    const options = new DocumentBuilder()
      .addBearerAuth()
      .setTitle('Home test system - API')
      .setDescription('by hanguyenbinh201282@gmail.com')
      .setVersion('1.0')
      .addTag('API')
      .build();
    const document = SwaggerModule.createDocument(app, options, {
      ignoreGlobalPrefix: false,
    });
    SwaggerModule.setup('swagger', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
  }
  await app.listen(
    appConfig.server.port || 3000,
    appConfig.server.host || '0.0.0.0',
  );
  app.use(helmet());
}
bootstrap();
