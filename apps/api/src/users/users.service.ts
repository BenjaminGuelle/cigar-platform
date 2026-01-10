import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../app/prisma.service';
import { StorageService } from '../common/services/storage.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { TastingStatus, User } from '@cigar-platform/prisma-client';
import { UserNotFoundException } from '../common/exceptions';
import { UserPublicProfileDto } from './dto/user-public-profile.dto';
import { ClubResponseDto } from '../club/dto';
import { isUuid, normalizeUsername } from '../common/utils/identifier.util';

/**
 * Service for managing user profiles
 */
@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly storageService: StorageService
  ) {}

  /**
   * Update user profile (displayName, username, avatarUrl, bio, visibility, shareEvaluationsPublicly)
   * @param userId - ID of the user to update
   * @param updateProfileDto - Profile update data
   * @returns Updated user
   */
  async updateProfile(
    userId: string,
    updateProfileDto: UpdateProfileDto
  ): Promise<User> {
    this.logger.log(`Updating profile for user ${userId}`);

    // Check if user exists
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UserNotFoundException(userId);
    }

    // Check username uniqueness if being updated
    if (updateProfileDto.username && updateProfileDto.username !== user.username) {
      const existingUser = await this.prismaService.user.findUnique({
        where: { username: updateProfileDto.username },
      });

      if (existingUser) {
        throw new Error(`Le nom d'utilisateur @${updateProfileDto.username} est déjà utilisé`);
      }
    }

    // Update user profile
    const updatedUser = await this.prismaService.user.update({
      where: { id: userId },
      data: {
        ...(updateProfileDto.displayName && {
          displayName: updateProfileDto.displayName,
        }),
        ...(updateProfileDto.username && {
          username: updateProfileDto.username,
        }),
        ...(updateProfileDto.avatarUrl !== undefined && {
          avatarUrl: updateProfileDto.avatarUrl,
        }),
        ...(updateProfileDto.bio !== undefined && {
          bio: updateProfileDto.bio,
        }),
        ...(updateProfileDto.visibility !== undefined && {
          visibility: updateProfileDto.visibility,
        }),
        ...(updateProfileDto.shareEvaluationsPublicly !== undefined && {
          shareEvaluationsPublicly: updateProfileDto.shareEvaluationsPublicly,
        }),
      },
    });

    this.logger.log(`Profile updated successfully for user ${userId}`);
    return updatedUser;
  }

  /**
   * Upload avatar and update user profile
   * Deletes old avatar if exists, uploads new one, and updates database
   *
   * @param userId - ID of the user
   * @param imageBuffer - Processed image buffer
   * @returns New avatar URL
   */
  async uploadAndUpdateAvatar(
    userId: string,
    imageBuffer: Buffer
  ): Promise<string> {
    this.logger.log(`Uploading new avatar for user ${userId}`);

    // Get current user to check for existing avatar
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UserNotFoundException(userId);
    }

    // Delete old avatar if exists
    if (user.avatarUrl) {
      await this.storageService.deleteImage(user.avatarUrl);
    }

    // Upload new avatar using generic storage service
    const avatarUrl = await this.storageService.uploadImage(
      'avatar',
      userId,
      imageBuffer
    );

    // Update user profile with new avatar URL
    await this.prismaService.user.update({
      where: { id: userId },
      data: { avatarUrl },
    });

    this.logger.log(`Avatar updated successfully for user ${userId}`);
    return avatarUrl;
  }

  /**
   * Get user by ID
   * @param userId - ID of the user
   * @returns User or null
   */
  async findById(userId: string): Promise<User | null> {
    return this.prismaService.user.findUnique({
      where: { id: userId },
    });
  }

  /**
   * Get public profile for a user with stats
   * Supports both UUID and username lookups
   * @param identifier - User ID (UUID) or username (with or without @)
   * @returns User public profile with stats
   */
  async getPublicProfile(identifier: string): Promise<UserPublicProfileDto> {
    this.logger.log(`Getting public profile for user ${identifier}`);

    // Determine if identifier is UUID or username
    const isId = isUuid(identifier);
    const username = isId ? null : normalizeUsername(identifier);

    // Get user basic info
    const user = await this.prismaService.user.findUnique({
      where: isId ? { id: identifier } : { username: username! },
      select: {
        id: true,
        displayName: true,
        username: true,
        visibility: true,
        avatarUrl: true,
        bio: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new UserNotFoundException(identifier);
    }

    // Use the resolved user ID for subsequent queries
    const userId = user.id;

    // Get tasting count (renamed from evaluation)
    const tastingCount = await this.prismaService.tasting.count({
      where: { userId },
    });

    // Get favorite brand (most tasted brand) and brandCount
    let favoriteBrand: string | null = null;
    let brandCount = 0;
    if (tastingCount > 0) {
      // Get distinct brands from tastings
      const tastingsWithBrand = await this.prismaService.tasting.findMany({
        where: { userId },
        select: {
          cigar: {
            select: {
              brand: {
                select: { id: true, name: true },
              },
            },
          },
        },
      });

      const brandCounts = new Map<string, { name: string; count: number }>();
      for (const t of tastingsWithBrand) {
        const brandId = t.cigar.brand.id;
        const existing = brandCounts.get(brandId);
        if (existing) {
          existing.count++;
        } else {
          brandCounts.set(brandId, { name: t.cigar.brand.name, count: 1 });
        }
      }

      brandCount = brandCounts.size;

      // Get favorite brand (most tasted)
      const sortedBrands = Array.from(brandCounts.values()).sort(
        (a, b) => b.count - a.count
      );
      favoriteBrand = sortedBrands[0]?.name ?? null;
    }

    // Get top 2 cigars from 5 best rated COMPLETED tastings (excludes drafts)
    let topCigars: string[] | null = null;
    if (tastingCount > 0) {
      const topRatedTastings = await this.prismaService.tasting.findMany({
        where: {
          userId,
          status: TastingStatus.COMPLETED,
          rating: { gt: 0 }, // Only tastings with a positive rating
        },
        include: {
          cigar: {
            select: { name: true },
          },
        },
        orderBy: { rating: 'desc' },
        take: 5,
      });

      // Get unique cigar names, keeping only top 2
      const seenCigars = new Set<string>();
      const uniqueTopCigars: string[] = [];
      for (const t of topRatedTastings) {
        if (!seenCigars.has(t.cigar.name) && uniqueTopCigars.length < 2) {
          seenCigars.add(t.cigar.name);
          uniqueTopCigars.push(t.cigar.name);
        }
      }
      topCigars = uniqueTopCigars.length > 0 ? uniqueTopCigars : null;
    }

    // Get club count
    const clubCount = await this.prismaService.clubMember.count({
      where: { userId },
    });

    return {
      id: user.id,
      displayName: user.displayName,
      username: user.username,
      visibility: user.visibility,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      createdAt: user.createdAt,
      stats: {
        evaluationCount: tastingCount,
        brandCount,
        favoriteBrand,
        topCigars,
        clubCount,
      },
    };
  }

  /**
   * Get clubs for a user (all clubs: public and private)
   * Supports both UUID and username lookups
   * @param identifier - User ID (UUID) or username (with or without @)
   * @param limit - Maximum number of clubs to return
   * @returns Array of clubs the user is member of
   */
  async getUserClubs(identifier: string, limit: number = 6): Promise<ClubResponseDto[]> {
    this.logger.log(`Getting clubs for user ${identifier} (limit: ${limit})`);

    // Determine if identifier is UUID or username
    const isId = isUuid(identifier);
    const username = isId ? null : normalizeUsername(identifier);

    // Check if user exists
    const user = await this.prismaService.user.findUnique({
      where: isId ? { id: identifier } : { username: username! },
    });

    if (!user) {
      throw new UserNotFoundException(identifier);
    }

    // Use the resolved user ID for subsequent queries
    const userId = user.id;

    // Get user's club memberships (all clubs, excluding archived)
    const memberships = await this.prismaService.clubMember.findMany({
      where: {
        userId,
        club: {
          isArchived: false,
        },
      },
      include: {
        club: {
          include: {
            _count: {
              select: { members: true },
            },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
      take: limit,
    });

    // Map to ClubResponseDto
    return memberships.map((membership) => ({
      id: membership.club.id,
      name: membership.club.name,
      slug: membership.club.slug,
      description: membership.club.description,
      imageUrl: membership.club.imageUrl,
      coverUrl: membership.club.coverUrl,
      visibility: membership.club.visibility,
      inviteCode: null, // Don't expose invite code on public profiles
      isPublicDirectory: membership.club.isPublicDirectory,
      autoApproveMembers: membership.club.autoApproveMembers,
      allowMemberInvites: membership.club.allowMemberInvites,
      maxMembers: membership.club.maxMembers,
      isArchived: membership.club.isArchived,
      createdBy: membership.club.createdBy,
      createdAt: membership.club.createdAt,
      updatedAt: membership.club.updatedAt,
      memberCount: membership.club._count.members,
    }));
  }

  /**
   * Check if username is available
   * @param username - Username to check
   * @param currentUserId - Optional current user ID (to exclude from check when updating own profile)
   * @returns true if username is available, false if taken
   */
  async isUsernameAvailable(
    username: string,
    currentUserId?: string
  ): Promise<boolean> {
    const existingUser = await this.prismaService.user.findUnique({
      where: { username },
      select: { id: true },
    });

    // Username is available if:
    // 1. No user found with this username
    // 2. OR the user found is the current user (updating their own profile)
    return !existingUser || existingUser.id === currentUserId;
  }
}