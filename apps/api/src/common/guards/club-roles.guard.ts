import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { PrismaService } from '../../app/prisma.service';
import { Role, ClubRole } from '../../../../../shared/types/src/lib/enums';

/**
 * Guard to check if user has permission to modify a club.
 * Allows:
 * - Club admins (ClubMember with role = admin)
 * - Project admins and moderators (User with role = ADMIN or MODERATOR)
 */
@Injectable()
export class ClubRolesGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user?.dbUser;
    const clubId = request.params.id;

    if (!user || !clubId) {
      return false;
    }

    // Project admins and moderators can modify any club
    if (user.role === Role.ADMIN || user.role === Role.MODERATOR) {
      return true;
    }

    // Check if user is admin of this specific club
    const clubMember = await this.prisma.clubMember.findUnique({
      where: {
        clubId_userId: {
          clubId: clubId,
          userId: user.id,
        },
      },
    });

    return clubMember?.role === ClubRole.Admin;
  }
}