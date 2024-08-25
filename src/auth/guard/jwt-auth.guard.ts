import { AuthGuard } from '@nestjs/passport';
import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector, private appConfig: any) {
    super();
  }
  canActivate(context: ExecutionContext) {
    const allowUnauthorizedRequest = this.reflector.get<boolean>(
      'AllowUnauthorized',
      context.getHandler(),
    );
    
    if (allowUnauthorizedRequest) {
      return true;
    }

    return super.canActivate(context);
  }
}
