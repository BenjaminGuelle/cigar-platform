import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { PrismaService } from '../../app/prisma.service';
import { Role, ClubRole } from '@cigar-platform/prisma-client';
import { ClubMember } from '../../../../../generated/prisma';

@Injectable()
export class ClubRolesGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: any = context.switchToHttp().getRequest();
    const user: any = request.user?.dbUser;
    const clubId: string = request.params.id;

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

    // Club owners and admins can manage the club
    return clubMember?.role === ClubRole.owner || clubMember?.role === ClubRole.admin;
  }
}