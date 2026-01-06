import { ApiProperty } from '@nestjs/swagger';
import { FeedbackResponseDto } from './feedback-response.dto';

class PaginationMeta {
  @ApiProperty({ example: 100 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;
}

export class PaginatedFeedbackResponseDto {
  @ApiProperty({ type: [FeedbackResponseDto] })
  data: FeedbackResponseDto[];

  @ApiProperty({ type: PaginationMeta })
  meta: PaginationMeta;
}
