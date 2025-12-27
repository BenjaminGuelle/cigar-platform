import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../app/prisma.service';
import { ClubMember, Prisma } from '../../../../generated/prisma';
import { ClubRole } from '@cigar-platform/prisma-client';
import {
  UpdateMemberRoleDto,
  TransferOwnershipDto,
  BanMemberDto,
  PaginatedMemberResponseDto,
  ClubMemberResponseDto,
} from './dto';
import {
  ClubNotFoundException,
  UserNotFoundException,
  MemberNotFoundException,
  MemberAlreadyExistsException,
  UserBannedException,
  CannotRemoveOwnerException,
  CannotTransferToSelfException,
} from './exceptions';

interface FilterMemberDto {
  page?: number;
  limit?: number;
  role?: ClubRole;
}


@Injectable()
export class ClubMemberService {
  private readonly logger = new Logger(ClubMemberService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Add a member to a club
   */
  async addMember(
    clubId: string,
    userId: string,
    role: ClubRole = ClubRole.member
  ): Promise<ClubMember> {
    // Check if club exists
    const club = await this.prisma.club.findUnique({
      where: { id: clubId },
    });

    if (!club) {
      throw new ClubNotFoundException(clubId);
    }

    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UserNotFoundException(userId);
    }

    // Check if user is banned
    const isBanned = await this.isBanned(clubId, userId);
    if (isBanned) {
      throw new UserBannedException(userId, clubId);
    }

    // Check if member already exists
    const existingMember = await this.prisma.clubMember.findUnique({
      where: {
        clubId_userId: {
          clubId,
          userId,
        },
      },
    });

    if (existingMember) {
      throw new MemberAlreadyExistsException(userId, clubId);
    }

    // Check if club is full
    if (club.maxMembers) {
      const memberCount = await this.prisma.clubMember.count({
        where: { clubId },
      });

      if (memberCount >= club.maxMembers) {
        throw new ForbiddenException('Club has reached maximum member capacity');
      }
    }

    const member = await this.prisma.clubMember.create({
      data: {
        clubId,
        userId,
        role,
      },
    });

    this.logger.log(`Member added: ${userId} to club ${clubId} with role ${role}`);
    return member;
  }

  /**
   * Remove a member from a club
   */
  async removeMember(clubId: string, userId: string): Promise<void> {
    const member = await this.prisma.clubMember.findUnique({
      where: {
        clubId_userId: {
          clubId,
          userId,
        },
      },
    });

    if (!member) {
      throw new MemberNotFoundException(userId, clubId);
    }

    // Cannot remove owner
    if (member.role === ClubRole.owner) {
      throw new CannotRemoveOwnerException();
    }

    await this.prisma.clubMember.delete({
      where: {
        clubId_userId: {
          clubId,
          userId,
        },
      },
    });

    this.logger.log(`Member removed: ${userId} from club ${clubId}`);
  }

  /**
   * Update member role
   */
  async updateMemberRole(
    clubId: string,
    userId: string,
    updateDto: UpdateMemberRoleDto
  ): Promise<ClubMember> {
    const member = await this.prisma.clubMember.findUnique({
      where: {
        clubId_userId: {
          clubId,
          userId,
        },
      },
    });

    if (!member) {
      throw new MemberNotFoundException(userId, clubId);
    }

    // Cannot change owner role directly (use transferOwnership)
    if (member.role === ClubRole.owner || updateDto.role === ClubRole.owner) {
      throw new ForbiddenException('Cannot change owner role directly. Use transfer ownership instead.');
    }

    const updatedMember = await this.prisma.clubMember.update({
      where: {
        clubId_userId: {
          clubId,
          userId,
        },
      },
      data: {
        role: updateDto.role,
      },
    });

    this.logger.log(`Member role updated: ${userId} in club ${clubId} to ${updateDto.role}`);
    return updatedMember;
  }

  /**
   * Transfer club ownership
   */
  async transferOwnership(
    clubId: string,
    currentOwnerId: string,
    transferDto: TransferOwnershipDto
  ): Promise<void> {
    const { newOwnerId } = transferDto;

    if (currentOwnerId === newOwnerId) {
      throw new CannotTransferToSelfException();
    }

    // Check current owner exists and has owner role
    const currentOwner = await this.prisma.clubMember.findUnique({
      where: {
        clubId_userId: {
          clubId,
          userId: currentOwnerId,
        },
      },
    });

    if (!currentOwner || currentOwner.role !== ClubRole.owner) {
      throw new ForbiddenException('Current user is not the owner');
    }

    // Check new owner exists and is a member
    const newOwner = await this.prisma.clubMember.findUnique({
      where: {
        clubId_userId: {
          clubId,
          userId: newOwnerId,
        },
      },
    });

    if (!newOwner) {
      throw new MemberNotFoundException(newOwnerId, clubId);
    }

    // Transfer ownership atomically
    await this.prisma.$transaction([
      // Demote current owner to admin
      this.prisma.clubMember.update({
        where: {
          clubId_userId: {
            clubId,
            userId: currentOwnerId,
          },
        },
        data: {
          role: ClubRole.admin,
        },
      }),
      // Promote new owner
      this.prisma.clubMember.update({
        where: {
          clubId_userId: {
            clubId,
            userId: newOwnerId,
          },
        },
        data: {
          role: ClubRole.owner,
        },
      }),
    ]);

    this.logger.log(`Ownership transferred from ${currentOwnerId} to ${newOwnerId} in club ${clubId}`);
  }

  /**
   * Get all members of a club
   */
  async getMembers(
    clubId: string,
    filter: FilterMemberDto = {}
  ): Promise<PaginatedMemberResponseDto> {
    const { page = 1, limit = 20, role } = filter;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.ClubMemberWhereInput = {
      clubId,
      ...(role && { role }),
    };

    // Execute queries in parallel
    const [members, total] = await Promise.all([
      this.prisma.clubMember.findMany({
        where,
        orderBy: [
          { role: 'asc' }, // owner -> admin -> member
          { joinedAt: 'asc' }, // oldest first
        ],
        skip,
        take: limit,
      }),
      this.prisma.clubMember.count({ where }),
    ]);

    return {
      data: members.map((member): ClubMemberResponseDto => ({
        id: member.id,
        clubId: member.clubId,
        userId: member.userId,
        role: member.role,
        joinedAt: member.joinedAt,
      })),
      meta: {
        total,
        page,
        limit,
      },
    };
  }

  /**
   * Get a specific member's role
   */
  async getMemberRole(clubId: string, userId: string): Promise<ClubRole | null> {
    const member = await this.prisma.clubMember.findUnique({
      where: {
        clubId_userId: {
          clubId,
          userId,
        },
      },
      select: {
        role: true,
      },
    });

    return member?.role ?? null;
  }

  /**
   * Ban a member from a club
   */
  async banMember(
    clubId: string,
    userId: string,
    bannedBy: string,
    banDto: BanMemberDto
  ): Promise<void> {
    // Check if member exists
    const member = await this.prisma.clubMember.findUnique({
      where: {
        clubId_userId: {
          clubId,
          userId,
        },
      },
    });

    if (!member) {
      throw new MemberNotFoundException(userId, clubId);
    }

    // Cannot ban owner or admin
    if (member.role === ClubRole.owner || member.role === ClubRole.admin) {
      throw new ForbiddenException('Cannot ban owner or admin');
    }

    // Check if already banned
    const existingBan = await this.prisma.clubBan.findUnique({
      where: {
        clubId_userId: {
          clubId,
          userId,
        },
      },
    });

    if (existingBan) {
      throw new ForbiddenException('User is already banned');
    }

    // Remove member and create ban atomically
    await this.prisma.$transaction([
      this.prisma.clubMember.delete({
        where: {
          clubId_userId: {
            clubId,
            userId,
          },
        },
      }),
      this.prisma.clubBan.create({
        data: {
          clubId,
          userId,
          bannedBy,
          reason: banDto.reason ?? null,
        },
      }),
    ]);

    this.logger.log(`Member banned: ${userId} from club ${clubId} by ${bannedBy}`);
  }

  /**
   * Unban a member from a club
   */
  async unbanMember(clubId: string, userId: string): Promise<void> {
    const ban = await this.prisma.clubBan.findUnique({
      where: {
        clubId_userId: {
          clubId,
          userId,
        },
      },
    });

    if (!ban) {
      throw new ForbiddenException('User is not banned');
    }

    await this.prisma.clubBan.delete({
      where: {
        clubId_userId: {
          clubId,
          userId,
        },
      },
    });

    this.logger.log(`Member unbanned: ${userId} from club ${clubId}`);
  }

  /**
   * Check if a user is banned from a club
   */
  async isBanned(clubId: string, userId: string): Promise<boolean> {
    const ban = await this.prisma.clubBan.findUnique({
      where: {
        clubId_userId: {
          clubId,
          userId,
        },
      },
    });

    return !!ban;
  }

  /**
   * Get current user's membership in a club (returns role)
   */
  async findMyMembership(clubId: string, userId: string): Promise<ClubMember | null> {
    const member = await this.prisma.clubMember.findUnique({
      where: {
        clubId_userId: {
          clubId,
          userId,
        },
      },
    });

    return member;
  }
}
