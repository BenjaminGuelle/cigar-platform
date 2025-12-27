import { ApiProperty } from '@nestjs/swagger';
import { PaginationMetaDto } from '../../common/dto/paginated-response.dto';
import { ClubMemberResponseDto } from './club-member-response.dto';

/**
 * Paginated Club Member Response DTO
 * Used for endpoints that return lists of club members
 */
export class PaginatedMemberResponseDto {
  @ApiProperty({
    type: [ClubMemberResponseDto],
    description: 'Array of club members',
  })
  data: ClubMemberResponseDto[];

  @ApiProperty({
    type: PaginationMetaDto,
    description: 'Pagination metadata',
  })
  meta: PaginationMetaDto;
}
