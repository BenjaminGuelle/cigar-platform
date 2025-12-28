import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../app/prisma.service';
import { Club, Prisma } from '../../../../generated/prisma';
import {
  CreateClubDto,
  UpdateClubDto,
  ClubResponseDto,
  ClubUserStatus,
  FilterClubDto,
  PaginatedClubResponseDto,
} from './dto';
import { PaginationMetaDto } from '../common/dto/paginated-response.dto';
import { ClubRole } from '@cigar-platform/prisma-client';
import {
  ClubNotFoundException,
  ClubAlreadyExistsException,
} from './exceptions';


@Injectable()
export class ClubService {
  private readonly logger = new Logger(ClubService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(
    createClubDto: CreateClubDto,
    userId: string
  ): Promise<ClubResponseDto> {
    // Check if club with same name already exists
    const existingClub = await this.prisma.club.findFirst({
      where: {
        name: {
          equals: createClubDto.name,
          mode: 'insensitive',
        },
      },
    });

    if (existingClub) {
      throw new ClubAlreadyExistsException(createClubDto.name);
    }

    try {
      // Use transaction to create club and club member atomically
      const club = await this.prisma.$transaction(async (tx) => {
        // Generate invite code if visibility is PRIVATE
        const inviteCode =
          createClubDto.visibility === 'PRIVATE'
            ? this.generateInviteCode()
            : null;

        // Create the club
        const newClub = await tx.club.create({
          data: {
            name: createClubDto.name,
            description: createClubDto.description ?? null,
            imageUrl: createClubDto.imageUrl ?? null,
            coverUrl: createClubDto.coverUrl ?? null,
            visibility: createClubDto.visibility ?? 'PUBLIC',
            inviteCode,
            isPublicDirectory: createClubDto.isPublicDirectory ?? true,
            autoApproveMembers: createClubDto.autoApproveMembers ?? true,
            allowMemberInvites: createClubDto.allowMemberInvites ?? false,
            maxMembers: createClubDto.maxMembers ?? null,
            createdBy: userId,
          },
        });

        // Automatically add creator as club owner
        await tx.clubMember.create({
          data: {
            clubId: newClub.id,
            userId: userId,
            role: ClubRole.owner,
          },
        });

        return newClub;
      });

      this.logger.log(`Club created: ${club.id} by user ${userId} (auto-assigned as owner)`);
      return this.mapToResponse(club, 1); // 1 member (the owner)
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ClubAlreadyExistsException(createClubDto.name);
      }
      throw error;
    }
  }

  /**
   * Generate unique invite code for private clubs
   * Format: CLUBNAME-XXXX (e.g., COHIBA-LOVERS-A7X9)
   */
  private generateInviteCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude similar chars (I, O, 0, 1)
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  async findAll(
    filter: FilterClubDto
  ): Promise<PaginatedClubResponseDto> {
    const { page = 1, limit = 10, search, sortBy = 'createdAt', order = 'desc' } = filter;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.ClubWhereInput = search
      ? {
          name: {
            contains: search,
            mode: 'insensitive',
          },
        }
      : {};

    // Build orderBy clause
    const orderBy: Prisma.ClubOrderByWithRelationInput = {
      [sortBy]: order,
    };

    // Execute queries in parallel
    const [clubs, total] = await Promise.all([
      this.prisma.club.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          description: true,
          imageUrl: true,
          coverUrl: true,
          visibility: true,
          inviteCode: true,
          isPublicDirectory: true,
          autoApproveMembers: true,
          allowMemberInvites: true,
          maxMembers: true,
          isArchived: true,
          createdBy: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              members: true,
            },
          },
        },
      }),
      this.prisma.club.count({ where }),
    ]);

    return {
      data: clubs.map((club) => this.mapToResponse(club, club._count.members)),
      meta: {
        total,
        page,
        limit,
      },
    };
  }

  async findOne(id: string, currentUserId?: string): Promise<ClubResponseDto> {
    const club = await this.prisma.club.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        imageUrl: true,
        coverUrl: true,
        visibility: true,
        inviteCode: true,
        isPublicDirectory: true,
        autoApproveMembers: true,
        allowMemberInvites: true,
        maxMembers: true,
        isArchived: true,
        createdBy: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            members: true,
          },
        },
      },
    });

    if (!club) {
      throw new ClubNotFoundException(id);
    }

    // Get current user's status if authenticated
    // Priority order: BANNED > MEMBER > PENDING > REJECTED > NONE
    let currentUserStatus: ClubUserStatus | undefined = undefined;
    let currentUserRole: ClubRole | undefined = undefined;

    if (currentUserId) {
      // 1. Check if user is banned (highest priority - blocks all actions)
      const ban = await this.prisma.clubBan.findUnique({
        where: {
          clubId_userId: {
            clubId: id,
            userId: currentUserId,
          },
        },
      });

      if (ban) {
        currentUserStatus = ClubUserStatus.BANNED;
      } else {
        // 2. Check if user is a member
        const membership = await this.prisma.clubMember.findUnique({
          where: {
            clubId_userId: {
              clubId: id,
              userId: currentUserId,
            },
          },
          select: {
            role: true,
          },
        });

        if (membership) {
          currentUserStatus = ClubUserStatus.MEMBER;
          currentUserRole = membership.role;
        } else {
          // 3. Check if user has a join request (PENDING or REJECTED)
          const joinRequest = await this.prisma.clubJoinRequest.findFirst({
            where: {
              clubId: id,
              userId: currentUserId,
            },
            orderBy: {
              createdAt: 'desc', // Get most recent request
            },
          });

          if (joinRequest) {
            if (joinRequest.status === 'PENDING') {
              currentUserStatus = ClubUserStatus.PENDING;
            } else if (joinRequest.status === 'REJECTED') {
              currentUserStatus = ClubUserStatus.REJECTED;
            }
            // If APPROVED, user should be a member (handled above)
          }
          // If no relationship found, currentUserStatus stays undefined (NONE)
        }
      }
    }

    return this.mapToResponse(club, club._count.members, currentUserStatus, currentUserRole);
  }

  async update(
    id: string,
    updateClubDto: UpdateClubDto
  ): Promise<ClubResponseDto> {
    // Check if club exists
    const existingClub = await this.prisma.club.findUnique({
      where: { id },
    });

    if (!existingClub) {
      throw new ClubNotFoundException(id);
    }

    // Check if new name conflicts with another club
    if (updateClubDto.name) {
      const clubWithSameName = await this.prisma.club.findFirst({
        where: {
          name: {
            equals: updateClubDto.name,
            mode: 'insensitive',
          },
          id: {
            not: id,
          },
        },
      });

      if (clubWithSameName) {
        throw new ClubAlreadyExistsException(updateClubDto.name);
      }
    }

    try {
      const club = await this.prisma.club.update({
        where: { id },
        data: {
          name: updateClubDto.name,
          description: updateClubDto.description,
          imageUrl: updateClubDto.imageUrl,
          coverUrl: updateClubDto.coverUrl,
          visibility: updateClubDto.visibility,
          isPublicDirectory: updateClubDto.isPublicDirectory,
          autoApproveMembers: updateClubDto.autoApproveMembers,
          allowMemberInvites: updateClubDto.allowMemberInvites,
          maxMembers: updateClubDto.maxMembers,
        },
        select: {
          id: true,
          name: true,
          description: true,
          imageUrl: true,
          coverUrl: true,
          visibility: true,
          inviteCode: true,
          isPublicDirectory: true,
          autoApproveMembers: true,
          allowMemberInvites: true,
          maxMembers: true,
          isArchived: true,
          createdBy: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              members: true,
            },
          },
        },
      });

      this.logger.log(`Club updated: ${club.id}`);
      return this.mapToResponse(club, club._count.members);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new ClubNotFoundException(id);
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await this.prisma.club.delete({
        where: { id },
      });

      this.logger.log(`Club deleted: ${id}`);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new ClubNotFoundException(id);
      }
      throw error;
    }
  }

  /**
   * Get user's clubs with their role in each club
   * ALL STARS: Single query, includes role, optimized
   */
  async findMyClubs(userId: string): Promise<any[]> {
    const memberships = await this.prisma.clubMember.findMany({
      where: { userId },
      include: {
        club: {
          include: {
            _count: {
              select: {
                members: true,
              },
            },
          },
        },
      },
      orderBy: {
        joinedAt: 'desc',
      },
    });

    return memberships.map((membership) => ({
      ...this.mapToResponse(membership.club, membership.club._count.members),
      myRole: membership.role,
    }));
  }

  private mapToResponse(
    club: Club,
    memberCount: number = 0,
    currentUserStatus?: ClubUserStatus,
    currentUserRole?: ClubRole,
  ): ClubResponseDto {
    return {
      id: club.id,
      name: club.name,
      description: club.description,
      imageUrl: club.imageUrl,
      coverUrl: club.coverUrl,
      visibility: club.visibility,
      inviteCode: club.inviteCode,
      isPublicDirectory: club.isPublicDirectory,
      autoApproveMembers: club.autoApproveMembers,
      allowMemberInvites: club.allowMemberInvites,
      maxMembers: club.maxMembers,
      isArchived: club.isArchived,
      createdBy: club.createdBy,
      createdAt: club.createdAt,
      updatedAt: club.updatedAt,
      memberCount,
      currentUserStatus,
      currentUserRole,
    };
  }
}