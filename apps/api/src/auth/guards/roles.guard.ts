import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@cigar-platform/prisma-client';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { RequestUser } from '../types';

/**
 * Roles Guard
 *
 * Checks if the current user has one of the required roles.
 * Must be used after JwtAuthGuard to ensure user is authenticated.
 *
 * @example
 * @UseGuards(JwtAuthGuard, RolesGuard)
 * @Roles(Role.ADMIN)
 * @Get('admin-only')
 * getAdminData() { ... }
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // No roles required = allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as RequestUser | undefined;

    // No user = deny access (shouldn't happen if JwtAuthGuard is used)
    if (!user) {
      return false;
    }

    return requiredRoles.includes(user.dbUser.role);
  }
}