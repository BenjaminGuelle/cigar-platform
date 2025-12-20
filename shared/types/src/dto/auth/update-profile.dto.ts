import { IsOptional, IsString, IsUrl } from 'class-validator';

/**
 * DTO for updating user profile information
 */
export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsUrl({}, { message: 'Avatar URL must be a valid URL' })
  avatarUrl?: string;
}