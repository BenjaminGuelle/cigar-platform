import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FeedbackType, FeedbackStatus } from '@cigar-platform/prisma-client';
import { FeedbackMetadata } from './create-feedback.dto';

export class FeedbackUserDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'john_doe' })
  username: string;

  @ApiProperty({ example: 'John Doe' })
  displayName: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  avatarUrl: string | null;
}

export class FeedbackResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  userId: string;

  @ApiProperty({ enum: FeedbackType, example: FeedbackType.BUG })
  type: FeedbackType;

  @ApiProperty({ example: 'I found a bug...' })
  message: string;

  @ApiProperty({ example: '/tasting/123/complete' })
  page: string;

  @ApiPropertyOptional({
    example: {
      userAgent: 'Mozilla/5.0...',
      screenWidth: 1920,
      screenHeight: 1080,
      platform: 'desktop',
      isPwa: false,
    },
  })
  metadata: FeedbackMetadata | null;

  @ApiProperty({ enum: FeedbackStatus, example: FeedbackStatus.NEW })
  status: FeedbackStatus;

  @ApiPropertyOptional({ example: 'Reproduced the bug' })
  adminNote: string | null;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  updatedAt: Date;

  @ApiPropertyOptional({ type: FeedbackUserDto })
  user?: FeedbackUserDto;
}
