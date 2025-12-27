import { ApiProperty } from '@nestjs/swagger';
import { PaginationMetaDto } from '../../common/dto/paginated-response.dto';
import { ClubResponseDto } from './club-response.dto';

/**
 * Paginated Club Response DTO
 * Used for endpoints that return lists of clubs
 */
export class PaginatedClubResponseDto {
  @ApiProperty({
    type: [ClubResponseDto],
    description: 'Array of clubs',
  })
  data: ClubResponseDto[];

  @ApiProperty({
    type: PaginationMetaDto,
    description: 'Pagination metadata',
  })
  meta: PaginationMetaDto;
}
