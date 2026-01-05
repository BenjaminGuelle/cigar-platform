import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Tasting Club DTO
 * Simplified club info for tasting responses
 */
export class TastingClubDto {
  @Expose()
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @Expose()
  @ApiProperty({ example: 'Club des Aficionados' })
  name: string;

  @Expose()
  @ApiProperty({ example: 'club-des-aficionados' })
  slug: string;
}