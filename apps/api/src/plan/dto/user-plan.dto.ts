import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { PlanType, PlanSource, PlanStatus } from '@cigar-platform/prisma-client';

/**
 * User Plan DTO
 * Represents a user's subscription plan with all relevant metadata.
 */
export class UserPlanDto {
  @Expose()
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @Expose()
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  userId: string;

  @Expose()
  @ApiProperty({
    enum: PlanType,
    example: PlanType.FREE,
    description: 'The effective access level (FREE or PREMIUM)',
  })
  type: PlanType;

  @Expose()
  @ApiProperty({
    enum: PlanSource,
    example: PlanSource.DEFAULT,
    description: 'How the user obtained this plan',
  })
  source: PlanSource;

  @Expose()
  @ApiProperty({
    enum: PlanStatus,
    example: PlanStatus.ACTIVE,
    description: 'Current status of the plan',
  })
  status: PlanStatus;

  @Expose()
  @ApiProperty({
    example: '2026-01-01T00:00:00.000Z',
    description: 'When this plan started',
  })
  startedAt: Date;

  @Expose()
  @ApiPropertyOptional({
    type: String,
    example: '2026-12-31T23:59:59.999Z',
    description: 'When this plan expires (null = never)',
  })
  expiresAt: Date | null;

  @Expose()
  @ApiPropertyOptional({
    type: String,
    example: 'Beta Tester',
    description: 'Reason for gift/beta access',
  })
  giftReason: string | null;

  // Computed fields (added by PlanService)

  @Expose()
  @ApiProperty({
    example: true,
    description: 'Whether the user currently has Premium access (considering expiration and grace period)',
  })
  isPremium: boolean;

  @Expose()
  @ApiProperty({
    example: 'Premium Beta',
    description: 'User-friendly label for the plan',
  })
  label: string;

  @Expose()
  @ApiPropertyOptional({
    type: Number,
    example: 30,
    description: 'Days remaining until expiration (null if no expiration)',
  })
  daysRemaining: number | null;

  @Expose()
  @ApiProperty({
    example: false,
    description: 'Whether the plan is expiring within 30 days',
  })
  isExpiringSoon: boolean;

  @Expose()
  @ApiProperty({
    example: false,
    description: 'Whether the user is in grace period (expired but still has access)',
  })
  isInGracePeriod: boolean;
}