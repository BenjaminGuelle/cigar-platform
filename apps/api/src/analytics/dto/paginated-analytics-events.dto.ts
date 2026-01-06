import { ApiProperty } from '@nestjs/swagger';
import { AnalyticsEventResponseDto } from './analytics-event-response.dto';

class PaginationMeta {
  @ApiProperty({ example: 100 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 50 })
  limit: number;
}

export class PaginatedAnalyticsEventsDto {
  @ApiProperty({ type: [AnalyticsEventResponseDto] })
  data: AnalyticsEventResponseDto[];

  @ApiProperty({ type: PaginationMeta })
  meta: PaginationMeta;
}
