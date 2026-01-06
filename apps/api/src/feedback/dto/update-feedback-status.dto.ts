import { IsString, IsOptional, IsEnum, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FeedbackStatus } from '@cigar-platform/prisma-client';
import { IsSecureText } from '../../common/validators/safe-text.validator';

export class UpdateFeedbackStatusDto {
  @IsEnum(FeedbackStatus)
  @ApiProperty({
    description: 'New status for the feedback',
    enum: FeedbackStatus,
    example: FeedbackStatus.IN_PROGRESS,
  })
  status: FeedbackStatus;

  @IsSecureText()
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  @ApiPropertyOptional({
    description: 'Admin note (internal)',
    example: 'Reproduced the bug, fixing in next release',
    maxLength: 1000,
  })
  adminNote?: string;
}
