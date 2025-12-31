import { ApiProperty } from '@nestjs/swagger';
import { PaginationMetaDto } from '../../common/dto/paginated-response.dto';
import { TastingResponseDto } from './tasting-response.dto';

/**
 * Paginated Tasting Response DTO
 * Used for endpoints that return lists of tastings
 */
export class PaginatedTastingResponseDto {
  @ApiProperty({
    type: [TastingResponseDto],
    description: 'Array of tastings',
  })
  data: TastingResponseDto[];

  @ApiProperty({
    type: PaginationMetaDto,
    description: 'Pagination metadata',
  })
  meta: PaginationMetaDto;
}
