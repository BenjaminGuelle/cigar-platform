import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsOptional,
  IsEnum,
  IsUrl,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  TastingMoment,
  TastingSituation,
  PairingType,
} from '@cigar-platform/prisma-client';
import { IsSecureText } from '../../common/validators/safe-text.validator';

/**
 * DTO for creating a new tasting (DRAFT)
 *
 * Phase 1 - Quick fields are optional at creation
 * Tasting starts in DRAFT status
 */
export class CreateTastingDto {
  @IsUUID()
  @IsNotEmpty()
  @ApiProperty({
    description: 'UUID of the cigar being tasted',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  cigarId: string;

  @IsUUID()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'UUID of the club to associate this tasting with',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  clubId?: string;

  @IsUUID()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'UUID of the event (if tasting during an event)',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  eventId?: string;

  // Phase 1 - Quick (all optional at creation, can be filled later)

  @IsEnum(TastingMoment)
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Time of day',
    enum: TastingMoment,
    example: TastingMoment.SOIR,
  })
  moment?: TastingMoment;

  @IsEnum(TastingSituation)
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Tasting situation',
    enum: TastingSituation,
    example: TastingSituation.DIGESTIF,
  })
  situation?: TastingSituation;

  @IsEnum(PairingType)
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Beverage pairing type',
    enum: PairingType,
    example: PairingType.WHISKY,
  })
  pairing?: PairingType;

  @IsString()
  @IsOptional()
  @IsSecureText()
  @ApiPropertyOptional({
    description: 'Pairing details (e.g., "Lagavulin 16")',
    example: 'Lagavulin 16 ans',
  })
  pairingNote?: string;

  @IsString()
  @IsOptional()
  @IsSecureText()
  @ApiPropertyOptional({
    description: 'Location (for solo tastings only)',
    example: 'Terrasse de mon appartement',
  })
  location?: string;

  @IsString()
  @IsOptional()
  @IsUrl()
  @ApiPropertyOptional({
    description: 'Photo URL',
    example: 'https://example.com/tasting-photo.jpg',
  })
  photoUrl?: string;

  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(300)
  @ApiPropertyOptional({
    description: 'Duration in minutes',
    example: 75,
    minimum: 1,
    maximum: 300,
  })
  duration?: number;
}
