import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorator to extract the current authenticated user from the request
 *
 * Usage:
 * - @CurrentUser() user: User → Returns full user object
 * - @CurrentUser('id') userId: string → Returns user.id
 * - @CurrentUser('email') email: string → Returns user.email
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    // If a specific property is requested, return just that property
    return data ? user?.[data] : user;
  }
);