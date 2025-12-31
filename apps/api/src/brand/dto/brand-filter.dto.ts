import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class BrandFilterDto {
  @IsString()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Search brands by name or slug (case-insensitive)',
    example: 'cohiba',
  })
  search?: string;
}
