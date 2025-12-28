import { ApiProperty } from '@nestjs/swagger';
import { PaginationMetaDto } from '../../common/dto/paginated-response.dto';
import { ClubBanResponseDto } from './club-ban-response.dto';

/**
 * Paginated Club Ban Response DTO
 * Used for endpoints that return lists of banned members
 */
export class PaginatedBanResponseDto {
  @ApiProperty({
    type: [ClubBanResponseDto],
    description: 'Array of banned members',
  })
  data: ClubBanResponseDto[];

  @ApiProperty({
    type: PaginationMetaDto,
    description: 'Pagination metadata',
  })
  meta: PaginationMetaDto;
}
