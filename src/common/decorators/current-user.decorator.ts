import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface CurrentUserOptions {
  required?: boolean;
}

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
