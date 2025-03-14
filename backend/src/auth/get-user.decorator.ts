import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { ApiParam } from '@nestjs/swagger';

export const GetUser = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return request.user;
});

// You can create a helper function to use with ApiParam
export const ApiGetUser = () =>
  ApiParam({
    name: 'user',
    description: 'User object extracted from JWT token',
    type: 'object',
  });
