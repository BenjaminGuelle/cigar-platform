import { Expose } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Observation Response DTO
 * Represents a tasting observation for a specific phase
 */
export class ObservationResponseDto {
  @Expose()
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @Expose()
  @ApiProperty({
    example: 'FIRST_THIRD',
    description: 'Tasting phase (COLD_DRAW, FIRST_THIRD, SECOND_THIRD, FINAL_THIRD)',
  })
  phase: string;

  @Expose()
  @ApiPropertyOptional({
    example: 3,
    description: 'Aroma intensity (1-5)',
  })
  intensity: number | null;

  @Expose()
  @ApiPropertyOptional({
    example: 4,
    description: 'Combustion quality (1-5)',
  })
  combustion: number | null;

  @Expose()
  @ApiProperty({
    example: ['bois', 'café', 'cuir'],
    description: 'Detected aromas',
  })
  aromas: string[];

  @Expose()
  @ApiPropertyOptional({
    example: 'Notes libres sur cette phase',
    description: 'Free-form notes',
  })
  notes: string | null;
}