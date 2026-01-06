import { ApiProperty } from '@nestjs/swagger';

export class EventCountDto {
  @ApiProperty({ example: 'tasting_completed' })
  event: string;

  @ApiProperty({ example: 150 })
  count: number;
}

export class DailyCountDto {
  @ApiProperty({ example: '2024-01-01' })
  date: string;

  @ApiProperty({ example: 42 })
  count: number;
}

export class PlatformCountDto {
  @ApiProperty({ example: 'desktop' })
  platform: string;

  @ApiProperty({ example: 1234 })
  count: number;
}

export class AnalyticsSummaryDto {
  @ApiProperty({ example: 5000 })
  totalEvents: number;

  @ApiProperty({ example: 1200 })
  uniqueUsers: number;

  @ApiProperty({ type: [EventCountDto] })
  eventCounts: EventCountDto[];

  @ApiProperty({ type: [DailyCountDto] })
  dailyCounts: DailyCountDto[];

  @ApiProperty({ type: [PlatformCountDto] })
  platformCounts: PlatformCountDto[];
}
