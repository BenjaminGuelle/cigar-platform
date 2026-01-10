import { Expose, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  TastingStatus,
  TastingMoment,
  TastingSituation,
  PairingType,
  TastingVisibility,
} from '@cigar-platform/prisma-client';
import { CigarResponseDto } from '../../cigar/dto/cigar-response.dto';
import { ObservationResponseDto } from './observation-response.dto';
import { TastingClubDto } from './tasting-club.dto';
import { TastingUserDto } from './tasting-user.dto';

/**
 * Tasting Response DTO
 * Returned by all tasting endpoints
 */
export class TastingResponseDto {
  @Expose()
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @Expose()
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  userId: string;

  @Expose()
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440002' })
  cigarId: string;

  @Expose()
  @Type(() => CigarResponseDto)
  @ApiProperty({ type: CigarResponseDto })
  cigar: CigarResponseDto;

  @Expose()
  @ApiPropertyOptional({ type: String, example: '550e8400-e29b-41d4-a716-446655440003' })
  eventId: string | null;

  // Status
  @Expose()
  @ApiProperty({ enum: TastingStatus, example: TastingStatus.DRAFT })
  status: TastingStatus;

  // Phase 1 - Quick
  @Expose()
  @ApiProperty({ example: '2024-12-31T20:00:00.000Z' })
  date: Date;

  @Expose()
  @ApiPropertyOptional({ enum: TastingMoment, example: TastingMoment.SOIR })
  moment: TastingMoment | null;

  @Expose()
  @ApiPropertyOptional({ enum: TastingSituation, example: TastingSituation.DIGESTIF })
  situation: TastingSituation | null;

  @Expose()
  @ApiPropertyOptional({ enum: PairingType, example: PairingType.WHISKY })
  pairing: PairingType | null;

  @Expose()
  @ApiPropertyOptional({ type: String, example: 'Lagavulin 16 ans' })
  pairingNote: string | null;

  @Expose()
  @ApiPropertyOptional({ type: String, example: 'Terrasse de mon appartement' })
  location: string | null;

  @Expose()
  @ApiPropertyOptional({ type: String, example: 'https://example.com/tasting-photo.jpg' })
  photoUrl: string | null;

  @Expose()
  @ApiPropertyOptional({ type: Number, example: 75 })
  duration: number | null;

  // Phase Finale
  @Expose()
  @ApiProperty({ example: 4.5 })
  rating: number;

  @Expose()
  @ApiPropertyOptional({ type: String, example: 'Excellent cigare, très équilibré.' })
  comment: string | null;

  @Expose()
  @ApiProperty({ enum: TastingVisibility, example: TastingVisibility.PUBLIC })
  visibility: TastingVisibility;

  // Timestamps
  @Expose()
  @ApiProperty({ example: '2024-12-31T20:00:00.000Z' })
  createdAt: Date;

  @Expose()
  @ApiProperty({ example: '2024-12-31T21:15:00.000Z' })
  updatedAt: Date;

  // Observations (chronic tasting data)
  @Expose()
  @Type(() => ObservationResponseDto)
  @ApiProperty({
    type: [ObservationResponseDto],
    description: 'Tasting observations by phase (chronic mode)',
  })
  observations: ObservationResponseDto[];

  // Associated clubs
  @Expose()
  @Type(() => TastingClubDto)
  @ApiProperty({
    type: [TastingClubDto],
    description: 'Clubs this tasting is shared with',
  })
  clubs: TastingClubDto[];

  // User info (optional, included in discovery context)
  @Expose()
  @Type(() => TastingUserDto)
  @ApiPropertyOptional({
    type: TastingUserDto,
    description: 'User who created the tasting (included in discovery endpoints)',
  })
  user?: TastingUserDto;
}
