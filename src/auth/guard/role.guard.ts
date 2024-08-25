import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class RoleGuard implements CanActivate {
  canActivate(context: ExecutionContext): any {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    return true;
  }
}