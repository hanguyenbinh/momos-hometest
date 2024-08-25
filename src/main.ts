import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/exception-filters/all-exception.filter';
import { JwtAuthGuard } from './auth/guard/jwt-auth.guard';
import configuration from './config/configuration';
import helmet from 'helmet';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const appConfig = configuration() as any;
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useGlobalFilters(new AllExceptionsFilter());
  app.enableCors();
  const reflector = app.get(Reflector);
  app.useGlobalGuards(new JwtAuthGuard(reflector, appConfig),);
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
