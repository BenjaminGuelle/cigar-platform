/**
 * Plan Constants
 *
 * Central configuration for the plan/subscription system.
 * These values control Beta period dates, grace periods, etc.
 */

/**
 * Beta Program Dates
 * Users who sign up during the beta period receive Premium access
 * until BETA_PREMIUM_EXPIRES.
 */
export const BETA_START = new Date('2026-01-01T00:00:00.000Z');
export const BETA_END = new Date('2026-07-01T00:00:00.000Z'); // Exclusive (ends June 30, 2026 23:59:59)
export const BETA_PREMIUM_EXPIRES = new Date('2026-12-31T23:59:59.999Z');

/**
 * Grace Period
 * Number of days after expiration during which user still has Premium access.
 * This allows time for payment issues to be resolved without losing access.
 */
export const GRACE_PERIOD_DAYS = 3;

/**
 * Plan Labels for UI
 * Maps plan type + source combinations to user-friendly labels.
 */
export const PLAN_LABELS: Record<string, string> = {
  'FREE_DEFAULT': 'Découverte',
  'PREMIUM_SUBSCRIPTION': 'Premium',
  'PREMIUM_TRIAL': 'Essai Premium',
  'PREMIUM_BETA': 'Premium Beta',
  'PREMIUM_GIFT': 'Premium Offert',
  'PREMIUM_LIFETIME': 'Premium à Vie',
};

/**
 * Check if a date is within the Beta period
 */
export function isBetaPeriod(date: Date = new Date()): boolean {
  return date >= BETA_START && date < BETA_END;
}

/**
 * Check if an expiration date is within grace period
 * Returns true if the plan expired but is still within grace period
 */
export function isWithinGracePeriod(expiresAt: Date | null): boolean {
  if (!expiresAt) return false;

  const now = new Date();
  if (expiresAt > now) return false; // Not expired yet

  const gracePeriodEnd = new Date(expiresAt);
  gracePeriodEnd.setDate(gracePeriodEnd.getDate() + GRACE_PERIOD_DAYS);

  return now <= gracePeriodEnd;
}

/**
 * Get the plan label for UI display
 */
export function getPlanLabel(type: string, source: string): string {
  const key = `${type}_${source}`;
  return PLAN_LABELS[key] ?? 'Découverte';
}