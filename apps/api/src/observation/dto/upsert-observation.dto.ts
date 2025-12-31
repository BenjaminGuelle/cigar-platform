import {
  IsOptional,
  IsInt,
  Min,
  Max,
  IsArray,
  IsString,
  IsObject,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsSecureText } from '../../common/validators/safe-text.validator';

/**
 * DTO for upserting an observation for a specific phase
 * Upsert = Create OR Update (based on tastingId + phase)
 */
export class UpsertObservationDto {
  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(5)
  @Type(() => Number)
  @ApiPropertyOptional({
    description: 'Aroma intensity (1-5)',
    minimum: 1,
    maximum: 5,
    example: 4,
  })
  intensity?: number;

  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(5)
  @Type(() => Number)
  @ApiPropertyOptional({
    description: 'Combustion quality (1-5)',
    minimum: 1,
    maximum: 5,
    example: 3,
  })
  combustion?: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Detected aromas (simple array)',
    example: ['boise', 'cafe', 'cuir', 'epice'],
    type: [String],
  })
  aromas?: string[];

  @IsString()
  @IsOptional()
  @IsSecureText()
  @ApiPropertyOptional({
    description: 'Free-form notes',
    example: 'Arômes complexes avec une belle évolution',
  })
  notes?: string;

  @IsObject()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Detailed organoleptic profile (JSON)',
    example: {
      presentation: {
        aspectCape: ['well_stretched', 'fine_grain'],
        couleurCape: 'colorado',
        toucher: ['firm', 'regular'],
      },
    },
  })
  organoleptique?: Record<string, unknown>;
}
