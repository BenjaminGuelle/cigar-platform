import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BrandResponseDto } from '../../brand/dto';

/**
 * Stats communautaires calculées à partir des tastings
 */
export class CigarStatsDto {
  @ApiProperty({ example: 4.5, description: 'Note moyenne communautaire (0-5)' })
  averageRating: number;

  @ApiProperty({ example: 24, description: 'Nombre de dégustations' })
  tastingCount: number;
}

export class CigarResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'Behike 52' })
  name: string;

  @ApiProperty({ example: 'cohiba-behike-52' })
  slug: string;

  @ApiProperty({ type: BrandResponseDto })
  brand: BrandResponseDto;

  // Specifications techniques
  @ApiPropertyOptional({ example: 'Robusto', description: 'Format du cigare' })
  vitola: string | null;

  @ApiPropertyOptional({ example: 130, description: 'Longueur en mm' })
  length: number | null;

  @ApiPropertyOptional({ example: 52, description: 'Ring gauge (diamètre)' })
  ringGauge: number | null;

  @ApiPropertyOptional({ example: 'Habano', description: 'Type de cape' })
  wrapper: string | null;

  @ApiPropertyOptional({ example: 'Cuba', description: "Pays d'origine" })
  origin: string | null;

  @ApiPropertyOptional({ example: 3, description: 'Force (1-5)' })
  strength: number | null;

  @ApiPropertyOptional({
    example: 'Un cigare exceptionnel...',
    description: 'Description détaillée',
  })
  description: string | null;

  // Status
  @ApiProperty({ example: false })
  isVerified: boolean;

  @ApiProperty({ example: 'PENDING' })
  status: string;

  @ApiProperty({ example: '2024-01-15T10:00:00Z' })
  createdAt: Date;

  // Stats communautaires
  @ApiProperty({ type: CigarStatsDto, description: 'Statistiques communautaires' })
  stats: CigarStatsDto;
}
