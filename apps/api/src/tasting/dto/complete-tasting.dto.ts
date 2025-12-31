import {
  IsNumber,
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TastingVisibility } from '@cigar-platform/prisma-client';
import { IsSecureText } from '../../common/validators/safe-text.validator';

/**
 * DTO for completing a tasting (DRAFT → COMPLETED)
 *
 * Phase Finale - Required fields to finalize the tasting
 */
export class CompleteTastingDto {
  @IsNumber()
  @IsNotEmpty()
  @Min(0.5)
  @Max(5)
  @ApiProperty({
    description: 'Rating from 0.5 to 5 (by steps of 0.5)',
    example: 4.5,
    minimum: 0.5,
    maximum: 5,
  })
  rating: number;

  @IsString()
  @IsOptional()
  @IsSecureText()
  @ApiPropertyOptional({
    description: 'Global comment about the tasting',
    example: 'Excellent cigare, très équilibré avec des notes de cèdre et de café.',
  })
  comment?: string;

  @IsEnum(TastingVisibility)
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Tasting visibility',
    enum: TastingVisibility,
    example: TastingVisibility.PUBLIC,
    default: TastingVisibility.PUBLIC,
  })
  visibility?: TastingVisibility;
}
