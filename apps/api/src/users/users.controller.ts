import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  ParseIntPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserPublicProfileDto } from './dto/user-public-profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MAX_IMAGE_SIZE, ALLOWED_IMAGE_MIMES } from '../common/config/image-presets.config';
import { ClubResponseDto } from '../club/dto';
import sharp from 'sharp';

/**
 * Controller for user profile management
 */
@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Get public profile for a user
   * GET /users/:id/profile
   * Public endpoint - no authentication required
   */
  @Get(':id/profile')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get user public profile with stats' })
  @ApiParam({ name: 'id', description: 'User ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({
    status: 200,
    description: 'User public profile retrieved successfully',
    type: UserPublicProfileDto,
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getPublicProfile(@Param('id') userId: string): Promise<UserPublicProfileDto> {
    return this.usersService.getPublicProfile(userId);
  }

  /**
   * Get clubs for a user
   * GET /users/:id/clubs
   * Public endpoint - no authentication required
   * Returns public clubs only
   */
  @Get(':id/clubs')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get user\'s public clubs' })
  @ApiParam({ name: 'id', description: 'User ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Maximum number of clubs to return',
    example: 6,
  })
  @ApiResponse({
    status: 200,
    description: 'User clubs retrieved successfully',
    type: [ClubResponseDto],
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserClubs(
    @Param('id') userId: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number
  ): Promise<ClubResponseDto[]> {
    return this.usersService.getUserClubs(userId, limit ?? 6);
  }

  /**
   * Update current user's profile
   * PATCH /users/me
   */
  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
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
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
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