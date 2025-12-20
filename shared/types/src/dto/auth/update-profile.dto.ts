import { IsOptional, IsString, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for updating user profile information
 */
export class UpdateProfileDto {
  @ApiProperty({ example: 'John Doe', description: 'User display name', required: false })
  @IsOptional()
  @IsString()
  displayName?: string;

  @ApiProperty({ example: 'https://example.com/avatar.jpg', description: 'User avatar URL', required: false })
  @IsOptional()
  @IsUrl({}, { message: 'Avatar URL must be a valid URL' })
  avatarUrl?: string;
}