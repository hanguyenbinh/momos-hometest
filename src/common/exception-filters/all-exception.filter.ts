import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { InvalidInputException } from '../exceptions/invalid-input.exception';
import { HttpResult } from '../http/http-result.http';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private logger = new Logger('response');
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    const exceptionType = exception.constructor;
    let result: any = null;
    let status = 0;    
    switch (exceptionType) {
      case QueryFailedError:
        status = 200;
        result = new HttpResult({
          status: false,
          message: 'DATABASE_QUERY_FAIL',
          data: exception['detail'],
        });
        break;
      case InvalidInputException:
        status = 200;
        result = new HttpResult({
          status: false,
          message: 'INPUT_VALIDATION_FAIL',
          data: exception['message'],
        });
        break;
      case UnauthorizedException:
        status = 401;
        result = new HttpResult({
          status: false,
          message: 'UNAUTHORIZED',
        });
        break;
      case BadRequestException:
        status = 400;
        result = new HttpResult({
          status: false,
          message: 'BAD_REQUEST',
        });
      default: {
        status =
          exception instanceof HttpException
            ? exception.getStatus()
            : HttpStatus.INTERNAL_SERVER_ERROR;
        result = new HttpResult({
          status: false,
          message: 'SYSTEM_ERROR',
          data: {
            message: exception['message'],
          },
        });
      }
    }
    const responseLog = JSON.stringify(result);
    this.logger.log(responseLog);
    this.logger.error(request.url);
    this.logger.error(exception);
    response.status(status).json(result);
  }
}
