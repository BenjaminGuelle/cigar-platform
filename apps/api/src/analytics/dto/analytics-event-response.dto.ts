import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AnalyticsEventUserDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'john_doe' })
  username: string;

  @ApiProperty({ example: 'John Doe' })
  displayName: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  avatarUrl: string | null;
}

export class AnalyticsEventResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174000' })
  userId: string | null;

  @ApiProperty({ example: 'tasting_completed' })
  event: string;

  @ApiPropertyOptional({
    description: 'Event-specific data',
    example: { cigarId: '123', rating: 4.5, phase: 'appearance' },
  })
  data: Record<string, unknown> | null;

  @ApiProperty({ example: '/tasting/123/complete' })
  page: string;

  @ApiPropertyOptional({ example: 'desktop' })
  platform: string | null;

  @ApiPropertyOptional({ example: 1920 })
  screenWidth: number | null;

  @ApiPropertyOptional({ example: 1080 })
  screenHeight: number | null;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiPropertyOptional({ type: AnalyticsEventUserDto })
  user?: AnalyticsEventUserDto | null;
}
