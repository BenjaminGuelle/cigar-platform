import { IsOptional, IsInt, Min, Max, IsEnum, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { FeedbackStatus, FeedbackType } from '@cigar-platform/prisma-client';

export class FeedbackFilterDto {
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
    example: 20,
    default: 20,
  })
  limit?: number;

  @IsOptional()
  @IsEnum(FeedbackStatus)
  @ApiPropertyOptional({
    description: 'Filter by status',
    enum: FeedbackStatus,
  })
  status?: FeedbackStatus;

  @IsOptional()
  @IsEnum(FeedbackType)
  @ApiPropertyOptional({
    description: 'Filter by type',
    enum: FeedbackType,
  })
  type?: FeedbackType;

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
