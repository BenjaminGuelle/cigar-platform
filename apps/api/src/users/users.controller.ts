import {
  Controller,
  Patch,
  Post,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MAX_IMAGE_SIZE, ALLOWED_IMAGE_MIMES } from '../common/config/image-presets.config';
import sharp from 'sharp';

/**
 * Controller for user profile management
 */
@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Update current user's profile
   * PATCH /users/me
   */
  @Patch('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateProfile(
    @Request() req: Express.Request & { user: { dbUser: { id: string } } },
    @Body() updateProfileDto: UpdateProfileDto
  ) {
    const userId = req.user.dbUser.id;
    const updatedUser = await this.usersService.updateProfile(
      userId,
      updateProfileDto
    );

    return {
      id: updatedUser.id,
      email: updatedUser.email,
      displayName: updatedUser.displayName,
      avatarUrl: updatedUser.avatarUrl,
      role: updatedUser.role,
      createdAt: updatedUser.createdAt,
    };
  }

  /**
   * Upload user avatar
   * POST /users/me/avatar
   *
   * All Stars 2026:
   * - Max size: 5MB
   * - Formats: JPEG, PNG, WebP
   * - Auto-resize: 256x256
   * - Auto-optimize: JPEG 90% quality
   * - Auto-delete: Old avatar removed
   */
  @Post('me/avatar')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('avatar', {
      limits: { fileSize: MAX_IMAGE_SIZE },
      fileFilter: (req, file, cb) => {
        if (!ALLOWED_IMAGE_MIMES.includes(file.mimetype as any)) {
          return cb(
            new BadRequestException(
              'Invalid file type. Only JPEG, PNG, and WebP are allowed.'
            ),
            false
          );
        }
        cb(null, true);
      },
    })
  )
  @ApiOperation({ summary: 'Upload user avatar' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Avatar image file',
    schema: {
      type: 'object',
      properties: {
        avatar: {
          type: 'string',
          format: 'binary',
          description: 'Image file (JPEG, PNG, WebP, max 5MB)',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Avatar uploaded successfully',
    schema: {
      type: 'object',
      properties: {
        avatarUrl: {
          type: 'string',
          example: 'https://...supabase.co/storage/v1/object/public/avatars/...',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid file or file too large' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async uploadAvatar(
    @Request() req: Express.Request & { user: { dbUser: { id: string } } },
    @UploadedFile() file: { buffer: Buffer; size: number; mimetype: string }
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Validate file size (double-check)
    if (file.size > MAX_IMAGE_SIZE) {
      throw new BadRequestException(
        `File too large. Maximum size is ${MAX_IMAGE_SIZE / 1024 / 1024}MB`
      );
    }

    try {
      // Process image with sharp (resize + optimize)
      // StorageService will handle the final processing, but we validate here
      const metadata = await sharp(file.buffer).metadata();

      if (!metadata.width || !metadata.height) {
        throw new BadRequestException('Invalid image file');
      }

      const userId = req.user.dbUser.id;

      // Upload and update avatar (includes deletion of old avatar)
      const avatarUrl = await this.usersService.uploadAndUpdateAvatar(
        userId,
        file.buffer
      );

      return { avatarUrl };
    } catch (error) {
      throw new BadRequestException(
        `Failed to process avatar: ${error.message}`
      );
    }
  }
}