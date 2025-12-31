import {
  IsOptional,
  IsInt,
  Min,
  Max,
  IsString,
  IsIn,
  IsEnum,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TastingStatus } from '@cigar-platform/prisma-client';

/**
 * DTO for filtering and paginating tastings
 */
export class FilterTastingDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  @ApiPropertyOptional({
    description: 'Page number',
    default: 1,
    minimum: 1,
    example: 1,
  })
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  @ApiPropertyOptional({
    description: 'Items per page',
    default: 10,
    minimum: 1,
    maximum: 100,
    example: 10,
  })
  limit?: number = 10;

  @IsOptional()
  @IsString()
  @IsIn(['date', 'rating', 'createdAt'])
  @ApiPropertyOptional({
    description: 'Sort by field',
    enum: ['date', 'rating', 'createdAt'],
    default: 'date',
    example: 'date',
  })
  sortBy?: string = 'date';

  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc'])
  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['asc', 'desc'],
    default: 'desc',
    example: 'desc',
  })
  order?: 'asc' | 'desc' = 'desc';

  // Filters
  @IsOptional()
  @IsEnum(TastingStatus)
  @ApiPropertyOptional({
    description: 'Filter by status',
    enum: TastingStatus,
    example: TastingStatus.COMPLETED,
  })
  status?: TastingStatus;

  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional({
    description: 'Filter by cigar ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  cigarId?: string;

  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional({
    description: 'Filter by user ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  userId?: string;

  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional({
    description: 'Filter by event ID',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  eventId?: string;
}
