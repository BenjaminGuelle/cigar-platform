import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@cigar-platform/prisma-client';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { AuthenticatedRequest, RequestDbUser } from '../../auth/types/request-user.type';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles: Role[] | undefined = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const request: AuthenticatedRequest = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user: RequestDbUser | undefined = request.user?.dbUser;

    if (!user) {
      return false;
    }

    return requiredRoles.includes(user.role);
  }
}