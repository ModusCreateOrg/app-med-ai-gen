import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { AuthGuard } from './auth.guard';

export function Auth() {
  return applyDecorators(
    SetMetadata('requiresAuth', true),
    UseGuards(AuthGuard),
  );
}
