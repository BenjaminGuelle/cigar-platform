import { Expose } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Observation Response DTO
 * Returned by all observation endpoints
 */
export class ObservationResponseDto {
  @Expose()
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @Expose()
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  tastingId: string;

  @Expose()
  @ApiProperty({
    example: 'presentation',
    description: 'Phase: presentation | fumage_cru | foin | divin | purin | conclusion',
  })
  phase: string;

  @Expose()
  @ApiPropertyOptional({ type: Number, example: 4 })
  intensity: number | null;

  @Expose()
  @ApiPropertyOptional({ type: Number, example: 3 })
  combustion: number | null;

  @Expose()
  @ApiPropertyOptional({ type: [String], example: ['boise', 'cafe', 'cuir'] })
  aromas: string[];

  @Expose()
  @ApiPropertyOptional({ type: String, example: 'Arômes complexes avec une belle évolution' })
  notes: string | null;

  @Expose()
  @ApiPropertyOptional({
    type: Object,
    example: {
      presentation: {
        wrapperAspect: ['well_stretched', 'fine_grain'],
        wrapperColor: 'colorado',
        touch: ['firm', 'regular'],
      },
    },
  })
  organoleptic: Record<string, unknown> | null;

  @Expose()
  @ApiProperty({ example: '2024-12-31T20:00:00.000Z' })
  createdAt: Date;

  @Expose()
  @ApiProperty({ example: '2024-12-31T21:15:00.000Z' })
  updatedAt: Date;
}
