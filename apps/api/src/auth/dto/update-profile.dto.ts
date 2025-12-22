import { IsOptional, IsString, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UpdateProfileRequest } from '@cigar-platform/types';

/**
 * DTO for updating user profile information
 * Implements UpdateProfileRequest to ensure consistency with frontend
 */
export class UpdateProfileDto implements UpdateProfileRequest {
  @ApiProperty({ example: 'John Doe', description: 'User display name', required: false })
  @IsOptional()
  @IsString()
  displayName?: string;

  @ApiProperty({ example: 'https://example.com/avatar.jpg', description: 'User avatar URL', required: false })
  @IsOptional()
  @IsUrl({}, { message: 'Avatar URL must be a valid URL' })
  avatarUrl?: string;
}