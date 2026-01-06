import { IsString, IsNotEmpty, IsEnum, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FeedbackType } from '@cigar-platform/prisma-client';
import { IsSecureText } from '../../common/validators/safe-text.validator';

/**
 * Metadata context for feedback submission
 */
export interface FeedbackMetadata {
  userAgent?: string;
  screenWidth?: number;
  screenHeight?: number;
  platform?: string;
  isPwa?: boolean;
}

export class CreateFeedbackDto {
  @IsEnum(FeedbackType)
  @ApiProperty({
    description: 'Type of feedback',
    enum: FeedbackType,
    example: FeedbackType.BUG,
  })
  type: FeedbackType;

  @IsSecureText()
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  @ApiProperty({
    description: 'Feedback message',
    example: 'I found a bug when trying to complete a tasting...',
    maxLength: 2000,
  })
  message: string;

  @IsSecureText()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @ApiProperty({
    description: 'Page URL where the feedback was submitted',
    example: '/tasting/123/complete',
    maxLength: 255,
  })
  page: string;

  @IsOptional()
  @ApiPropertyOptional({
    description: 'Client metadata (auto-collected)',
    example: {
      userAgent: 'Mozilla/5.0...',
      screenWidth: 1920,
      screenHeight: 1080,
      platform: 'desktop',
      isPwa: false,
    },
  })
  metadata?: FeedbackMetadata;
}
