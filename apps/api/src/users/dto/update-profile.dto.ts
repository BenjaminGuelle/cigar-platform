import { IsString, IsOptional, IsBoolean, IsEnum, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { UpdateProfileRequest } from '@cigar-platform/types';
import { UserVisibility } from '@cigar-platform/prisma-client';

/**
 * DTO for updating user profile
 * Editable fields: displayName, username, avatarUrl, bio, visibility, shareEvaluationsPublicly
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

  @IsOptional()
  @IsString()
  @MinLength(3, { message: "Le nom d'utilisateur doit contenir au moins 3 caractères" })
  @MaxLength(30, { message: "Le nom d'utilisateur ne peut pas dépasser 30 caractères" })
  @Matches(/^[a-z0-9._]{3,30}$/, {
    message: "Le nom d'utilisateur ne peut contenir que des lettres minuscules, chiffres, points (.) et underscores (_)",
  })
  @ApiPropertyOptional({
    description: 'Username (unique identifier) - lowercase, alphanumeric + dots + underscores only',
    example: 'johnny_cigars',
    pattern: '^[a-z0-9._]{3,30}$',
    minLength: 3,
    maxLength: 30,
    required: false,
  })
  username?: string;

  @IsOptional()
  @IsEnum(UserVisibility, {
    message: 'La visibilité doit être PUBLIC ou PRIVATE',
  })
  @ApiPropertyOptional({
    description: 'Profile visibility - PUBLIC: displayName visible | PRIVATE: only @username visible',
    enum: UserVisibility,
    example: UserVisibility.PUBLIC,
    required: false,
  })
  visibility?: UserVisibility;
}