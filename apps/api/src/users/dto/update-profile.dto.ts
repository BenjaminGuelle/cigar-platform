import { IsString, IsOptional, IsBoolean, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { UpdateProfileRequest } from '@cigar-platform/types';

/**
 * DTO for updating user profile
 * Editable fields: displayName, avatarUrl, bio, shareEvaluationsPublicly
 * Implements UpdateProfileRequest to ensure consistency with frontend
 */
export class UpdateProfileDto implements UpdateProfileRequest {
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Le nom doit contenir au moins 2 caractères' })
  @MaxLength(50, { message: 'Le nom ne peut pas dépasser 50 caractères' })
  @Matches(/^[\p{L}\p{N}\s\-_.🔥💨🚬]+$/u, {
    message: 'Le nom contient des caractères non autorisés',
  })
  @ApiProperty({
    description: 'Display name of the user',
    example: 'Johnny Cigars 🔥',
    required: false,
  })
  displayName?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Avatar URL',
    example: 'https://example.com/avatar.jpg',
    required: false,
  })
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'La bio ne peut pas dépasser 500 caractères' })
  @ApiPropertyOptional({
    description: 'User bio/description',
    example: 'Passionate cigar enthusiast from Paris',
    required: false,
  })
  bio?: string;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({
    description: 'Share evaluations publicly on user profile',
    example: true,
    required: false,
  })
  shareEvaluationsPublicly?: boolean;
}