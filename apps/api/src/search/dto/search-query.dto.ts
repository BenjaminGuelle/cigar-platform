import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

/**
 * Search Query DTO
 * Supports prefix-based search:
 * - '@username' → Search users only
 * - '#slug' → Search clubs only
 * - 'query' → Global search (cigars, brands, clubs, users)
 */
export class SearchQueryDto {
  @ApiProperty({
    description: 'Search query with optional prefix (@ for users, # for clubs)',
    example: 'cohiba',
    minLength: 1,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(100)
  q: string;
}
