import { ApiProperty } from '@nestjs/swagger';

/**
 * Simplified cigar info for discovery feed
 */
export class DiscoverCigarDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'Behike 52' })
  name: string;

  @ApiProperty({ example: 'cohiba-behike-52' })
  slug: string;

  @ApiProperty({ example: 'Cohiba' })
  brandName: string;

  @ApiProperty({ example: '2024-01-15T10:00:00Z' })
  createdAt: Date;
}

/**
 * Simplified tasting info for discovery feed
 */
export class DiscoverTastingDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'Montecristo No.2 Edición Limitada' })
  cigarName: string;

  @ApiProperty({ example: 'cohiba-behike-52' })
  cigarSlug: string;

  @ApiProperty({ example: 4.5 })
  rating: number;

  @ApiProperty({ example: 'benjamin' })
  username: string;

  @ApiProperty({ example: '2024-12-31T20:00:00.000Z' })
  createdAt: Date;
}

/**
 * Discovery Response DTO
 * Contains recent cigars and public tastings for the explore page
 */
export class DiscoverResponseDto {
  @ApiProperty({
    type: [DiscoverCigarDto],
    description: 'Recently added cigars (newest first)',
  })
  recentCigars: DiscoverCigarDto[];

  @ApiProperty({
    type: [DiscoverTastingDto],
    description: 'Recent public tastings (newest first)',
  })
  recentTastings: DiscoverTastingDto[];
}