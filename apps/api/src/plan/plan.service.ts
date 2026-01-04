import { Injectable } from '@nestjs/common';
import {
  PlanType,
  PlanSource,
  PlanStatus,
  UserPlan,
} from '@cigar-platform/prisma-client';
import { PrismaService } from '../app/prisma.service';
import { UserPlanDto } from './dto';
import {
  BETA_PREMIUM_EXPIRES,
  isBetaPeriod,
  isWithinGracePeriod,
  getPlanLabel,
} from './plan.constants';

/**
 * Plan Service
 *
 * Manages user subscription plans with support for:
 * - Beta program automatic assignment
 * - Grace period handling
 * - Premium access calculation
 * - Plan lifecycle management
 */
@Injectable()
export class PlanService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get or create a user's plan
   * Creates a default FREE plan if none exists
   */
  async getOrCreatePlan(userId: string): Promise<UserPlanDto> {
    let plan = await this.prisma.userPlan.findUnique({
      where: { userId },
    });

    if (!plan) {
      // Create default FREE plan
      plan = await this.prisma.userPlan.create({
        data: {
          userId,
          type: PlanType.FREE,
          source: PlanSource.DEFAULT,
          status: PlanStatus.ACTIVE,
        },
      });
    }

    return this.mapToDto(plan);
  }

  /**
   * Create a Beta plan for a new user during beta period
   * Call this during signup when in beta period
   */
  async createBetaPlan(userId: string): Promise<UserPlanDto> {
    const plan = await this.prisma.userPlan.create({
      data: {
        userId,
        type: PlanType.PREMIUM,
        source: PlanSource.BETA,
        status: PlanStatus.ACTIVE,
        expiresAt: BETA_PREMIUM_EXPIRES,
        giftReason: 'Beta Tester',
      },
    });

    return this.mapToDto(plan);
  }

  /**
   * Create a FREE default plan for post-beta signups
   */
  async createDefaultPlan(userId: string): Promise<UserPlanDto> {
    const plan = await this.prisma.userPlan.create({
      data: {
        userId,
        type: PlanType.FREE,
        source: PlanSource.DEFAULT,
        status: PlanStatus.ACTIVE,
      },
    });

    return this.mapToDto(plan);
  }

  /**
   * Create the appropriate plan for a new user
   * - During beta: PREMIUM/BETA with expiration
   * - After beta: FREE/DEFAULT
   */
  async createPlanForNewUser(userId: string): Promise<UserPlanDto> {
    if (isBetaPeriod()) {
      return this.createBetaPlan(userId);
    }
    return this.createDefaultPlan(userId);
  }

  /**
   * Gift a Premium plan to a user (admin action)
   */
  async giftPremium(
    userId: string,
    expiresAt: Date | null,
    giftedBy: string,
    giftReason?: string
  ): Promise<UserPlanDto> {
    const plan = await this.prisma.userPlan.upsert({
      where: { userId },
      update: {
        type: PlanType.PREMIUM,
        source: PlanSource.GIFT,
        status: PlanStatus.ACTIVE,
        startedAt: new Date(),
        expiresAt,
        giftedBy,
        giftReason: giftReason ?? 'Gift from admin',
      },
      create: {
        userId,
        type: PlanType.PREMIUM,
        source: PlanSource.GIFT,
        status: PlanStatus.ACTIVE,
        expiresAt,
        giftedBy,
        giftReason: giftReason ?? 'Gift from admin',
      },
    });

    return this.mapToDto(plan);
  }

  /**
   * Upgrade a user to LIFETIME Premium (admin action)
   */
  async upgradeToPremiumLifetime(
    userId: string,
    giftedBy: string,
    giftReason?: string
  ): Promise<UserPlanDto> {
    const plan = await this.prisma.userPlan.upsert({
      where: { userId },
      update: {
        type: PlanType.PREMIUM,
        source: PlanSource.LIFETIME,
        status: PlanStatus.ACTIVE,
        startedAt: new Date(),
        expiresAt: null, // Never expires
        giftedBy,
        giftReason: giftReason ?? 'Lifetime access',
      },
      create: {
        userId,
        type: PlanType.PREMIUM,
        source: PlanSource.LIFETIME,
        status: PlanStatus.ACTIVE,
        expiresAt: null,
        giftedBy,
        giftReason: giftReason ?? 'Lifetime access',
      },
    });

    return this.mapToDto(plan);
  }

  /**
   * Check if a user has Premium access
   * Considers plan type, status, expiration, and grace period
   */
  isPremium(plan: UserPlan | null): boolean {
    if (!plan) return false;
    if (plan.type !== PlanType.PREMIUM) return false;
    if (plan.status !== PlanStatus.ACTIVE) return false;

    // No expiration = always active
    if (!plan.expiresAt) return true;

    const now = new Date();

    // Not expired yet
    if (plan.expiresAt > now) return true;

    // Check grace period
    return isWithinGracePeriod(plan.expiresAt);
  }

  /**
   * Calculate days remaining until expiration
   */
  getDaysRemaining(expiresAt: Date | null): number | null {
    if (!expiresAt) return null;

    const now = new Date();
    const diff = expiresAt.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

    return Math.max(0, days);
  }

  /**
   * Check if plan is expiring within 30 days
   */
  isExpiringSoon(expiresAt: Date | null): boolean {
    const daysRemaining = this.getDaysRemaining(expiresAt);
    if (daysRemaining === null) return false;
    return daysRemaining > 0 && daysRemaining <= 30;
  }

  /**
   * Map Prisma UserPlan to DTO with computed fields
   */
  mapToDto(plan: UserPlan): UserPlanDto {
    const isPremium = this.isPremium(plan);
    const daysRemaining = this.getDaysRemaining(plan.expiresAt);
    const isExpiringSoon = this.isExpiringSoon(plan.expiresAt);
    const isInGracePeriod = isWithinGracePeriod(plan.expiresAt);

    // Determine effective label
    // If expired and not in grace period, show as "Découverte"
    const effectiveType = isPremium ? plan.type : PlanType.FREE;
    const effectiveSource = isPremium ? plan.source : PlanSource.DEFAULT;
    const label = getPlanLabel(effectiveType, effectiveSource);

    return {
      id: plan.id,
      userId: plan.userId,
      type: plan.type,
      source: plan.source,
      status: plan.status,
      startedAt: plan.startedAt,
      expiresAt: plan.expiresAt,
      giftReason: plan.giftReason,
      isPremium,
      label,
      daysRemaining,
      isExpiringSoon,
      isInGracePeriod,
    };
  }

  /**
   * Create a default FREE plan DTO (for users without a plan in DB)
   */
  getDefaultPlanDto(userId: string): UserPlanDto {
    return {
      id: '',
      userId,
      type: PlanType.FREE,
      source: PlanSource.DEFAULT,
      status: PlanStatus.ACTIVE,
      startedAt: new Date(),
      expiresAt: null,
      giftReason: null,
      isPremium: false,
      label: 'Découverte',
      daysRemaining: null,
      isExpiringSoon: false,
      isInGracePeriod: false,
    };
  }
}