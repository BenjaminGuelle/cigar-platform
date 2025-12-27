import { Injectable, Logger, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../app/prisma.service';
import { ClubJoinRequest, Prisma } from '../../../../generated/prisma';
import { JoinRequestStatus, ClubRole } from '@cigar-platform/prisma-client';
import {
  CreateJoinRequestDto,
  UpdateJoinRequestDto,
  JoinByCodeDto,
  JoinByCodeResponseDto,
  PaginatedJoinRequestResponseDto,
  ClubJoinRequestResponseDto,
} from './dto';
import { ClubService } from './club.service';
import {
  ClubNotFoundException,
  MemberAlreadyExistsException,
  UserBannedException,
} from './exceptions';
import { ClubMemberService } from './club-member.service';

interface FilterJoinRequestDto {
  page?: number;
  limit?: number;
  status?: JoinRequestStatus;
}


@Injectable()
export class ClubJoinRequestService {
  private readonly logger = new Logger(ClubJoinRequestService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly clubMemberService: ClubMemberService,
    private readonly clubService: ClubService
  ) {}

  /**
   * Create a join request for a club
   * Implements contextual logic (Option B):
   * - If autoApproveMembers=true → Auto-approve and add member
   * - Otherwise → Create PENDING join request
   */
  async createJoinRequest(
    clubId: string,
    userId: string,
    createDto: CreateJoinRequestDto
  ): Promise<ClubJoinRequest | { autoApproved: true; memberId: string }> {
    // Check if club exists
    const club = await this.prisma.club.findUnique({
      where: { id: clubId },
    });

    if (!club) {
      throw new ClubNotFoundException(clubId);
    }

    // Check if user is banned
    const isBanned = await this.clubMemberService.isBanned(clubId, userId);
    if (isBanned) {
      throw new UserBannedException(userId, clubId);
    }

    // Check if user is already a member
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

    // Check if there's already a pending request
    const existingRequest = await this.prisma.clubJoinRequest.findFirst({
      where: {
        clubId,
        userId,
        status: JoinRequestStatus.PENDING,
      },
    });

    if (existingRequest) {
      throw new ForbiddenException('You already have a pending join request for this club');
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

    // Contextual logic: Auto-approve if enabled
    if (club.autoApproveMembers) {
      const member = await this.clubMemberService.addMember(clubId, userId, ClubRole.member);
      this.logger.log(`Join request auto-approved for user ${userId} in club ${clubId}`);
      return { autoApproved: true, memberId: member.id };
    }

    // Otherwise, create a pending join request
    const joinRequest = await this.prisma.clubJoinRequest.create({
      data: {
        clubId,
        userId,
        message: createDto.message ?? null,
        status: JoinRequestStatus.PENDING,
      },
    });

    this.logger.log(`Join request created: ${joinRequest.id} for user ${userId} in club ${clubId}`);
    return joinRequest;
  }

  /**
   * Join a club using an invite code
   * Auto-approves if code is valid
   */
  async joinByCode(joinDto: JoinByCodeDto, userId: string): Promise<JoinByCodeResponseDto> {
    const { code } = joinDto;

    // Find club by invite code
    const club = await this.prisma.club.findFirst({
      where: {
        inviteCode: code,
        visibility: 'PRIVATE', // Only PRIVATE clubs have invite codes
      },
    });

    if (!club) {
      throw new BadRequestException('Invalid invite code');
    }

    // Check if user is banned
    const isBanned = await this.clubMemberService.isBanned(club.id, userId);
    if (isBanned) {
      throw new UserBannedException(userId, club.id);
    }

    // Check if user is already a member
    const existingMember = await this.prisma.clubMember.findUnique({
      where: {
        clubId_userId: {
          clubId: club.id,
          userId,
        },
      },
    });

    if (existingMember) {
      throw new MemberAlreadyExistsException(userId, club.id);
    }

    // Check if club is full
    if (club.maxMembers) {
      const memberCount = await this.prisma.clubMember.count({
        where: { clubId: club.id },
      });

      if (memberCount >= club.maxMembers) {
        throw new ForbiddenException('Club has reached maximum member capacity');
      }
    }

    // Auto-approve with invite code
    const member = await this.clubMemberService.addMember(club.id, userId, ClubRole.member);
    this.logger.log(`User ${userId} joined club ${club.id} using invite code`);

    // Get the club response DTO
    const clubResponse = await this.clubService.findOne(club.id);

    return {
      club: clubResponse,
      role: ClubRole.member,
    };
  }

  /**
   * Update a join request status (approve/reject)
   */
  async updateJoinRequest(
    requestId: string,
    reviewedBy: string,
    updateDto: UpdateJoinRequestDto
  ): Promise<ClubJoinRequest> {
    const joinRequest = await this.prisma.clubJoinRequest.findUnique({
      where: { id: requestId },
    });

    if (!joinRequest) {
      throw new BadRequestException('Join request not found');
    }

    if (joinRequest.status !== JoinRequestStatus.PENDING) {
      throw new ForbiddenException('Join request has already been processed');
    }

    // If approving, add member to club
    if (updateDto.status === JoinRequestStatus.APPROVED) {
      await this.clubMemberService.addMember(
        joinRequest.clubId,
        joinRequest.userId,
        ClubRole.member
      );
      this.logger.log(`Join request approved: ${requestId} by ${reviewedBy}`);
    } else {
      this.logger.log(`Join request rejected: ${requestId} by ${reviewedBy}`);
    }

    // Update request status
    const updatedRequest = await this.prisma.clubJoinRequest.update({
      where: { id: requestId },
      data: {
        status: updateDto.status,
      },
    });

    return updatedRequest;
  }

  /**
   * Get all join requests for a club
   */
  async getJoinRequests(
    clubId: string,
    filter: FilterJoinRequestDto = {}
  ): Promise<PaginatedJoinRequestResponseDto> {
    const { page = 1, limit = 20, status } = filter;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.ClubJoinRequestWhereInput = {
      clubId,
      ...(status && { status }),
    };

    // Execute queries in parallel
    const [requests, total] = await Promise.all([
      this.prisma.clubJoinRequest.findMany({
        where,
        orderBy: [
          { status: 'asc' }, // PENDING first
          { createdAt: 'desc' }, // newest first
        ],
        skip,
        take: limit,
      }),
      this.prisma.clubJoinRequest.count({ where }),
    ]);

    return {
      data: requests.map((request): ClubJoinRequestResponseDto => ({
        id: request.id,
        clubId: request.clubId,
        userId: request.userId,
        status: request.status,
        message: request.message,
        createdAt: request.createdAt,
        updatedAt: request.updatedAt,
      })),
      meta: {
        total,
        page,
        limit,
      },
    };
  }

  /**
   * Get all join requests by a user
   */
  async getUserJoinRequests(
    userId: string,
    filter: FilterJoinRequestDto = {}
  ): Promise<PaginatedJoinRequestResponseDto> {
    const { page = 1, limit = 20, status } = filter;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.ClubJoinRequestWhereInput = {
      userId,
      ...(status && { status }),
    };

    // Execute queries in parallel
    const [requests, total] = await Promise.all([
      this.prisma.clubJoinRequest.findMany({
        where,
        orderBy: [
          { status: 'asc' }, // PENDING first
          { createdAt: 'desc' }, // newest first
        ],
        skip,
        take: limit,
      }),
      this.prisma.clubJoinRequest.count({ where }),
    ]);

    return {
      data: requests.map((request): ClubJoinRequestResponseDto => ({
        id: request.id,
        clubId: request.clubId,
        userId: request.userId,
        status: request.status,
        message: request.message,
        createdAt: request.createdAt,
        updatedAt: request.updatedAt,
      })),
      meta: {
        total,
        page,
        limit,
      },
    };
  }

  /**
   * Cancel a pending join request
   */
  async cancelJoinRequest(requestId: string, userId: string): Promise<void> {
    const joinRequest = await this.prisma.clubJoinRequest.findUnique({
      where: { id: requestId },
    });

    if (!joinRequest) {
      throw new BadRequestException('Join request not found');
    }

    if (joinRequest.userId !== userId) {
      throw new ForbiddenException('You can only cancel your own join requests');
    }

    if (joinRequest.status !== JoinRequestStatus.PENDING) {
      throw new ForbiddenException('Can only cancel pending join requests');
    }

    await this.prisma.clubJoinRequest.delete({
      where: { id: requestId },
    });

    this.logger.log(`Join request cancelled: ${requestId} by user ${userId}`);
  }
}
