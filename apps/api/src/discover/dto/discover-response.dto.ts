import { ApiProperty } from '@nestjs/swagger';
import { TastingResponseDto } from '../../tasting/dto/tasting-response.dto';

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
    type: [TastingResponseDto],
    description: 'Recent public tastings (newest first)',
  })
  recentTastings: TastingResponseDto[];
}