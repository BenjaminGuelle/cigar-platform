import { IsString, IsNotEmpty, IsOptional, MaxLength, IsInt, Min, Max, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsSecureText } from '../../common/validators/safe-text.validator';

export class TrackEventDto {
  @Matches(/^[a-z_]+$/, { message: 'Event name must be lowercase snake_case' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @ApiProperty({
    description: 'Event name (lowercase snake_case)',
    example: 'tasting_completed',
    maxLength: 100,
  })
  event: string;

  @IsOptional()
  @ApiPropertyOptional({
    description: 'Event-specific data',
    example: { cigarId: '123', rating: 4.5 },
  })
  data?: Record<string, unknown>;

  @IsSecureText()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @ApiProperty({
    description: 'Page URL where the event occurred',
    example: '/tasting/123/complete',
    maxLength: 255,
  })
  page: string;

  @Matches(/^(desktop|android|ios|web)$/, { message: 'Platform must be desktop, android, ios or web' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  @ApiPropertyOptional({
    description: 'Platform (desktop, android, ios, web)',
    example: 'desktop',
    maxLength: 50,
  })
  platform?: string;

  @IsInt()
  @IsOptional()
  @Min(0)
  @Max(10000)
  @ApiPropertyOptional({
    description: 'Screen width in pixels',
    example: 1920,
  })
  screenWidth?: number;

  @IsInt()
  @IsOptional()
  @Min(0)
  @Max(10000)
  @ApiPropertyOptional({
    description: 'Screen height in pixels',
    example: 1080,
  })
  screenHeight?: number;
}
