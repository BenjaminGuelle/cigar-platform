import { ApiProperty } from '@nestjs/swagger';

/**
 * Pagination Metadata
 */
export class PaginationMetaDto {
  @ApiProperty({ example: 100, description: 'Total number of items' })
  total: number;

  @ApiProperty({ example: 1, description: 'Current page number' })
  page: number;

  @ApiProperty({ example: 20, description: 'Items per page' })
  limit: number;
}

/**
 * Paginated Response Base Class
 * Cannot use generics with Swagger, so we extend this for specific types
 */
export class PaginatedResponseDto<T> {
  @ApiProperty({ isArray: true, description: 'Array of items' })
  data: T[];

  @ApiProperty({ type: PaginationMetaDto, description: 'Pagination metadata' })
  meta: PaginationMetaDto;
}
