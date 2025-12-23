import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../app/prisma.service';
import { StorageService } from '../common/services/storage.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { User } from '@cigar-platform/prisma-client';
import { UserNotFoundException } from '../common/exceptions';

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
   * Update user profile (displayName, avatarUrl)
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

    // Update user profile
    const updatedUser = await this.prismaService.user.update({
      where: { id: userId },
      data: {
        ...(updateProfileDto.displayName && {
          displayName: updateProfileDto.displayName,
        }),
        ...(updateProfileDto.avatarUrl !== undefined && {
          avatarUrl: updateProfileDto.avatarUrl,
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
}