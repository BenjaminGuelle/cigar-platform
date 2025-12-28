import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../app/prisma.service';
import { Role, ClubRole } from '@cigar-platform/prisma-client';
import { ClubMember } from '../../../../../generated/prisma';
import { CLUB_ROLES_KEY } from '../decorators/club-roles.decorator';
import { AuthenticatedRequest, RequestDbUser } from '../../auth/types/request-user.type';

@Injectable()
export class ClubRolesGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<ClubRole[]>(CLUB_ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request: AuthenticatedRequest = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user: RequestDbUser | undefined = request.user?.dbUser;
    const clubId: string = request.params.id || request.params.clubId || request.body?.clubId;

    if (!user || !clubId) {
      return false;
    }

    // Platform admins and moderators have access to all clubs
    if (user.role === Role.SUPER_ADMIN || user.role === Role.MODERATOR) {
      return true;
    }

    const clubMember: ClubMember | null = await this.prisma.clubMember.findUnique({
      where: {
        clubId_userId: {
          clubId: clubId,
          userId: user.id,
        },
      },
    });

    if (!clubMember) {
      return false;
    }

    // If no specific roles required, just check membership
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // Check if user has any of the required roles
    return requiredRoles.includes(clubMember.role);
  }
}