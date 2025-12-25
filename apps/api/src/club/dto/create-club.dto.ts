import {
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsOptional,
  IsUrl,
  IsEnum,
  IsBoolean,
  IsInt,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ClubVisibility } from '@cigar-platform/prisma-client';

export class CreateClubDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(100)
  @ApiProperty({
    description: 'Club name',
    example: 'Cigar Lovers Paris',
    minLength: 3,
    maxLength: 100,
  })
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  @ApiPropertyOptional({
    description: 'Club description',
    example: 'A club for cigar enthusiasts in Paris, meeting every month',
    maxLength: 1000,
  })
  description?: string;

  @IsString()
  @IsOptional()
  @IsUrl()
  @ApiPropertyOptional({
    description: 'Club avatar image URL',
    example: 'https://example.com/club-avatar.jpg',
  })
  imageUrl?: string;

  @IsString()
  @IsOptional()
  @IsUrl()
  @ApiPropertyOptional({
    description: 'Club cover image URL',
    example: 'https://example.com/club-cover.jpg',
  })
  coverUrl?: string;

  @IsEnum(ClubVisibility)
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Club visibility',
    enum: ClubVisibility,
    example: ClubVisibility.PUBLIC,
    default: ClubVisibility.PUBLIC,
  })
  visibility?: ClubVisibility;

  @IsBoolean()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Auto-approve join requests',
    example: true,
    default: true,
  })
  autoApproveMembers?: boolean;

  @IsBoolean()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Allow members to invite others',
    example: false,
    default: false,
  })
  allowMemberInvites?: boolean;

  @IsInt()
  @IsOptional()
  @Min(1)
  @ApiPropertyOptional({
    description: 'Maximum number of members (null = unlimited)',
    example: 100,
  })
  maxMembers?: number;

  @IsBoolean()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Show in public directory (even if PRIVATE)',
    example: true,
    default: true,
  })
  isPublicDirectory?: boolean;
}