import { IsOptional, IsInt, Min, Max, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class AnalyticsEventFilterDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  @ApiPropertyOptional({
    description: 'Page number',
    example: 1,
    default: 1,
  })
  page?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  @ApiPropertyOptional({
    description: 'Items per page',
    example: 50,
    default: 50,
  })
  limit?: number;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: 'Filter by event name',
    example: 'tasting_started',
  })
  event?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: 'Filter by user ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  userId?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: 'Sort by field',
    example: 'createdAt',
    default: 'createdAt',
  })
  sortBy?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: 'Sort order',
    example: 'desc',
    default: 'desc',
  })
  order?: 'asc' | 'desc';
}
