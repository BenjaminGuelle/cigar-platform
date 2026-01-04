import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../app/prisma.service';
import { StorageService } from '../common/services/storage.service';
import { PlanService } from '../plan/plan.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { TastingStatus, User } from '@cigar-platform/prisma-client';
import { UserNotFoundException } from '../common/exceptions';
import { UserPublicProfileDto } from './dto/user-public-profile.dto';
import {
  UserProfileStatsResponseDto,
  AromaStatDto,
  TerroirStatDto,
  JournalTastingDto,
} from './dto/profile-stats.dto';
import { ClubResponseDto } from '../club/dto';
import { isUuid, normalizeUsername } from '../common/utils/identifier.util';
import { getCountryCode } from '../common/utils/country-code.util';

/**
 * Service for managing user profiles
 */
@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly storageService: StorageService,
    private readonly planService: PlanService
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

    // Get favorite brand (most tasted brand)
    let favoriteBrand: string | null = null;
    if (tastingCount > 0) {
      const brandStats = await this.prismaService.tasting.groupBy({
        by: ['cigarId'],
        where: { userId },
        _count: { cigarId: true },
        orderBy: { _count: { cigarId: 'desc' } },
        take: 1,
      });

      if (brandStats.length > 0) {
        const topCigar = await this.prismaService.cigar.findUnique({
          where: { id: brandStats[0].cigarId },
          select: {
            brand: {
              select: { name: true },
            },
          },
        });
        favoriteBrand = topCigar?.brand.name ?? null;
      }
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
        evaluationCount: tastingCount, // Renamed field for backward compatibility
        favoriteBrand,
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

  /**
   * Get profile stats for the current user (Solo context)
   * Includes parcours, aroma signature, terroirs, and journal
   *
   * @param userId - ID of the user
   * @returns Complete profile stats
   */
  async getProfileStats(userId: string): Promise<UserProfileStatsResponseDto> {
    this.logger.log(`Getting profile stats for user ${userId}`);

    // Get user with plan
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      include: { plan: true },
    });

    if (!user) {
      throw new UserNotFoundException(userId);
    }

    // Check Premium status
    const isPremium = this.planService.isPremium(user.plan);

    // Get completed tastings with observations and cigar data
    const tastings = await this.prismaService.tasting.findMany({
      where: {
        userId,
        status: TastingStatus.COMPLETED,
      },
      include: {
        cigar: {
          include: {
            brand: true,
          },
        },
        observations: true,
      },
      orderBy: { date: 'desc' },
    });

    // Calculate parcours stats
    const brandIds = new Set(tastings.map((t) => t.cigar.brandId));
    const origins = new Set(
      tastings.map((t) => t.cigar.origin).filter(Boolean)
    );

    const parcours = {
      tastingCount: tastings.length,
      brandCount: brandIds.size,
      terroirCount: origins.size,
    };

    // Check if user has chronic data (tastings with observations)
    const chronicTastings = tastings.filter((t) => t.observations.length > 0);
    const hasChronicData = chronicTastings.length > 0;

    // Calculate aroma signature and terroirs only if Premium AND has chronic data
    let aromaSignature: AromaStatDto[] | null = null;
    let terroirs: TerroirStatDto[] | null = null;

    if (isPremium && hasChronicData) {
      // Aggregate aromas from all observations
      const aromaCount = new Map<string, number>();
      let totalObservations = 0;

      for (const tasting of chronicTastings) {
        for (const observation of tasting.observations) {
          totalObservations++;
          for (const aroma of observation.aromas) {
            aromaCount.set(aroma, (aromaCount.get(aroma) ?? 0) + 1);
          }
        }
      }

      // Calculate top 4 aromas by frequency
      if (totalObservations > 0) {
        aromaSignature = Array.from(aromaCount.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 4)
          .map(([name, count]) => ({
            name,
            percentage: Math.round((count / totalObservations) * 100),
          }));
      }

      // Calculate terroir stats from chronic tastings only
      const terroirCount = new Map<string, number>();
      for (const tasting of chronicTastings) {
        const origin = tasting.cigar.origin;
        if (origin) {
          terroirCount.set(origin, (terroirCount.get(origin) ?? 0) + 1);
        }
      }

      if (terroirCount.size > 0) {
        const totalChronicTastings = chronicTastings.length;
        terroirs = Array.from(terroirCount.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([country, count]) => ({
            country,
            code: getCountryCode(country),
            percentage: Math.round((count / totalChronicTastings) * 100),
          }));
      }
    }

    // Build journal (last 3 completed tastings)
    const journal: JournalTastingDto[] = tastings.slice(0, 3).map((tasting) => {
      // Get top 2-3 aromas from observations (only if Premium and has observations)
      let aromas: string[] | null = null;
      if (isPremium && tasting.observations.length > 0) {
        const tastingAromaCount = new Map<string, number>();
        for (const observation of tasting.observations) {
          for (const aroma of observation.aromas) {
            tastingAromaCount.set(aroma, (tastingAromaCount.get(aroma) ?? 0) + 1);
          }
        }
        aromas = Array.from(tastingAromaCount.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 2)
          .map(([name]) => name);
      }

      return {
        id: tasting.id,
        cigarName: tasting.cigar.name,
        brandName: tasting.cigar.brand.name,
        brandLogoUrl: tasting.cigar.brand.logoUrl,
        rating: tasting.rating,
        date: tasting.date,
        aromas,
        user: null, // Solo context - no user info needed
      };
    });

    return {
      parcours,
      isPremium,
      hasChronicData,
      aromaSignature,
      terroirs,
      journal,
    };
  }
}