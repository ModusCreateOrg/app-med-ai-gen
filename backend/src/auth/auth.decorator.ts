import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { AuthGuard } from './auth.guard';

export function Auth() {
  // Temporarily disabled authentication
  return applyDecorators();
}
