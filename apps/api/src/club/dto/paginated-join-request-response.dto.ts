import { ApiProperty } from '@nestjs/swagger';
import { PaginationMetaDto } from '../../common/dto/paginated-response.dto';
import { ClubJoinRequestResponseDto } from './club-join-request-response.dto';

/**
 * Paginated Join Request Response DTO
 * Used for endpoints that return lists of join requests
 */
export class PaginatedJoinRequestResponseDto {
  @ApiProperty({
    type: [ClubJoinRequestResponseDto],
    description: 'Array of join requests',
  })
  data: ClubJoinRequestResponseDto[];

  @ApiProperty({
    type: PaginationMetaDto,
    description: 'Pagination metadata',
  })
  meta: PaginationMetaDto;
}
