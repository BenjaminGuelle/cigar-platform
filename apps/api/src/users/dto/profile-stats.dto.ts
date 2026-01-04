import { Expose, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Aroma Stat DTO
 * Individual aroma with frequency percentage
 */
export class AromaStatDto {
  @Expose()
  @ApiProperty({ example: 'Boisé', description: 'Aroma name' })
  name: string;

  @Expose()
  @ApiProperty({ example: 72, description: 'Frequency percentage (0-100)' })
  percentage: number;
}

/**
 * Terroir Stat DTO
 * Country/origin with percentage and ISO code for flag display
 */
export class TerroirStatDto {
  @Expose()
  @ApiProperty({ example: 'Cuba', description: 'Country name' })
  country: string;

  @Expose()
  @ApiProperty({ example: 'cu', description: 'ISO 3166-1 alpha-2 country code (lowercase)' })
  code: string;

  @Expose()
  @ApiProperty({ example: 65, description: 'Percentage of tastings from this country' })
  percentage: number;
}

/**
 * Journal Tasting User DTO
 * Minimal user info for club journal display
 */
export class JournalTastingUserDto {
  @Expose()
  @ApiProperty({ example: 'benjamin' })
  username: string;

  @Expose()
  @ApiProperty({ example: 'Benjamin' })
  displayName: string;

  @Expose()
  @ApiPropertyOptional({ type: String, example: 'https://...' })
  avatarUrl: string | null;
}

/**
 * Journal Tasting DTO
 * Simplified tasting for profile journal display
 */
export class JournalTastingDto {
  @Expose()
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @Expose()
  @ApiProperty({ example: 'Cohiba Behike 52', description: 'Cigar name' })
  cigarName: string;

  @Expose()
  @ApiProperty({ example: 'Cohiba', description: 'Brand name' })
  brandName: string;

  @Expose()
  @ApiPropertyOptional({ type: String, example: 'https://...', description: 'Brand logo URL' })
  brandLogoUrl: string | null;

  @Expose()
  @ApiProperty({ example: 4.5, description: 'Rating (0.5-5)' })
  rating: number;

  @Expose()
  @ApiProperty({ example: '2024-12-31T20:00:00.000Z', description: 'Tasting date' })
  date: Date;

  @Expose()
  @ApiPropertyOptional({
    type: [String],
    example: ['Boisé', 'Épicé'],
    description: 'Top 2-3 aromas from observations (null if no chronic observations)',
  })
  aromas: string[] | null;

  @Expose()
  @ApiPropertyOptional({
    type: JournalTastingUserDto,
    description: 'User who made the tasting (for club context only)',
  })
  @Type(() => JournalTastingUserDto)
  user: JournalTastingUserDto | null;
}

/**
 * Parcours Stats DTO
 * Basic stats for the profile header section
 */
export class ParcoursStatsDto {
  @Expose()
  @ApiProperty({ example: 12, description: 'Total number of tastings' })
  tastingCount: number;

  @Expose()
  @ApiProperty({ example: 8, description: 'Number of unique brands tasted' })
  brandCount: number;

  @Expose()
  @ApiProperty({ example: 4, description: 'Number of unique terroirs/countries' })
  terroirCount: number;
}

/**
 * Club Parcours Stats DTO
 * Club-specific stats with members and events instead of brands
 */
export class ClubParcoursStatsDto {
  @Expose()
  @ApiProperty({ example: 42, description: 'Total number of tastings shared with club' })
  tastingCount: number;

  @Expose()
  @ApiProperty({ example: 12, description: 'Number of members' })
  memberCount: number;

  @Expose()
  @ApiProperty({ example: 8, description: 'Number of events' })
  eventCount: number;
}

/**
 * User Profile Stats Response DTO
 * Complete profile stats for a user (Solo context)
 */
export class UserProfileStatsResponseDto {
  @Expose()
  @Type(() => ParcoursStatsDto)
  @ApiProperty({ type: ParcoursStatsDto, description: 'Parcours stats' })
  parcours: ParcoursStatsDto;

  @Expose()
  @ApiProperty({
    description: 'Whether the user has Premium access (needed for frontend display logic)',
  })
  isPremium: boolean;

  @Expose()
  @ApiProperty({
    description: 'Whether the user has chronic observation data',
  })
  hasChronicData: boolean;

  @Expose()
  @ApiPropertyOptional({
    type: [AromaStatDto],
    description: 'Top 4 aromas (null if not Premium or no chronic data)',
  })
  @Type(() => AromaStatDto)
  aromaSignature: AromaStatDto[] | null;

  @Expose()
  @ApiPropertyOptional({
    type: [TerroirStatDto],
    description: 'Top 3 terroirs (null if not Premium or no chronic data)',
  })
  @Type(() => TerroirStatDto)
  terroirs: TerroirStatDto[] | null;

  @Expose()
  @Type(() => JournalTastingDto)
  @ApiProperty({
    type: [JournalTastingDto],
    description: 'Last 3 completed tastings',
  })
  journal: JournalTastingDto[];
}

/**
 * Club Profile Stats Response DTO
 * Complete profile stats for a club
 */
export class ClubProfileStatsResponseDto {
  @Expose()
  @Type(() => ClubParcoursStatsDto)
  @ApiProperty({ type: ClubParcoursStatsDto, description: 'Club parcours stats' })
  parcours: ClubParcoursStatsDto;

  @Expose()
  @ApiProperty({
    description: 'Whether the club has chronic observation data (from Premium members)',
  })
  hasChronicData: boolean;

  @Expose()
  @ApiProperty({
    example: 24,
    description: 'Number of chronic tastings contributing to signature (for transparency)',
  })
  chronicTastingCount: number;

  @Expose()
  @ApiPropertyOptional({
    type: [AromaStatDto],
    description: 'Top 4 aromas aggregated from Premium members (null if no chronic data)',
  })
  @Type(() => AromaStatDto)
  aromaSignature: AromaStatDto[] | null;

  @Expose()
  @ApiPropertyOptional({
    type: [TerroirStatDto],
    description: 'Top 3 terroirs (null if no chronic data)',
  })
  @Type(() => TerroirStatDto)
  terroirs: TerroirStatDto[] | null;

  @Expose()
  @Type(() => JournalTastingDto)
  @ApiProperty({
    type: [JournalTastingDto],
    description: 'Last 3 completed tastings shared with the club',
  })
  journal: JournalTastingDto[];
}