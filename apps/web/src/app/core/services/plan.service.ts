import { Injectable, inject, computed, Signal } from '@angular/core';
import { AuthService } from './auth.service';
import type { UserPlanDto } from '@cigar-platform/types';

/**
 * Plan Service
 *
 * Provides computed signals for user subscription plan information.
 * Derives all data from AuthService.currentUser().plan
 *
 * @example
 * ```typescript
 * @Component({...})
 * export class FeatureComponent {
 *   #planService = inject(PlanService);
 *
 *   // Use in template
 *   isPremium = this.#planService.isPremium;
 *   planLabel = this.#planService.planLabel;
 *
 *   // Conditionally show premium features
 *   canAccessAdvancedStats = computed(() => this.#planService.isPremium());
 * }
 * ```
 */
@Injectable({
  providedIn: 'root',
})
export class PlanService {
  #authService = inject(AuthService);

  /**
   * Current user plan or null if no user/plan
   */
  readonly plan: Signal<UserPlanDto | null> = computed(() =>
    this.#authService.currentUser()?.plan ?? null
  );

  /**
   * Whether user has Premium access (considering expiration and grace period)
   * This is the main flag to check for premium features
   */
  readonly isPremium: Signal<boolean> = computed(() =>
    this.plan()?.isPremium ?? false
  );

  /**
   * User-friendly label for the plan (e.g., "Premium Beta", "Découverte")
   */
  readonly planLabel: Signal<string> = computed(() =>
    this.plan()?.label ?? 'Découverte'
  );

  /**
   * Plan type: FREE or PREMIUM
   */
  readonly planType: Signal<string> = computed(() =>
    this.plan()?.type ?? 'FREE'
  );

  /**
   * How the user got this plan: DEFAULT, BETA, GIFT, SUBSCRIPTION, etc.
   */
  readonly planSource: Signal<string> = computed(() =>
    this.plan()?.source ?? 'DEFAULT'
  );

  /**
   * Days remaining until plan expires (null if no expiration)
   */
  readonly daysRemaining: Signal<number | null> = computed(() =>
    this.plan()?.daysRemaining ?? null
  );

  /**
   * Whether plan is expiring within 30 days
   */
  readonly isExpiringSoon: Signal<boolean> = computed(() =>
    this.plan()?.isExpiringSoon ?? false
  );

  /**
   * Whether user is in grace period (expired but still has access)
   */
  readonly isInGracePeriod: Signal<boolean> = computed(() =>
    this.plan()?.isInGracePeriod ?? false
  );

  /**
   * Plan expiration date or null if no expiration
   */
  readonly expiresAt: Signal<Date | null> = computed(() => {
    const plan = this.plan();
    return plan?.expiresAt ? new Date(plan.expiresAt) : null;
  });

  /**
   * Plan start date
   */
  readonly startedAt: Signal<Date | null> = computed(() => {
    const plan = this.plan();
    return plan?.startedAt ? new Date(plan.startedAt) : null;
  });

  /**
   * Gift reason (for BETA or GIFT plans)
   */
  readonly giftReason: Signal<string | null> = computed(() =>
    this.plan()?.giftReason ?? null
  );

  /**
   * Whether user is a Beta tester
   */
  readonly isBetaTester: Signal<boolean> = computed(() =>
    this.plan()?.source === 'BETA'
  );

  /**
   * Whether user has lifetime access
   */
  readonly isLifetime: Signal<boolean> = computed(() =>
    this.plan()?.source === 'LIFETIME'
  );

  /**
   * Format expiration date for display
   */
  readonly formattedExpiresAt: Signal<string | null> = computed(() => {
    const expiresAt = this.expiresAt();
    if (!expiresAt) return null;

    return expiresAt.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  });
}