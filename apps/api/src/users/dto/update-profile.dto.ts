import { IsString, IsOptional, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for updating user profile
 * Only displayName and avatarUrl are editable
 */
export class UpdateProfileDto {
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
}