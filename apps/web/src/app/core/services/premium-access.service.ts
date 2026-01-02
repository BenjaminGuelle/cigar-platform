import { Injectable, signal, computed } from '@angular/core';

/**
 * Premium Access Service
 * Gestion du plan utilisateur (FREE vs PREMIUM)
 *
 * ALL STARS Architecture ⭐
 * - Single Responsibility: Détection et gestion du plan
 * - Dev-friendly: Override temporaire pour dev/test
 * - Future-proof: Prêt pour intégration avec User.plan
 *
 * @example
 * ```typescript
 * const premiumService = inject(PremiumAccessService);
 *
 * // Check access
 * if (premiumService.isPremium()) {
 *   // Show premium features
 * }
 *
 * // Dev override (temporary)
 * premiumService.setDevPlan('PREMIUM');
 * ```
 */
@Injectable({
  providedIn: 'root',
})
export class PremiumAccessService {
  /**
   * Dev override pour tester sans avoir User.plan
   * TODO: Remplacer par signal dérivé de authStore.user().plan
   *
   * IMPORTANT: Cette var sera retirée quand User aura le champ `plan`
   */
  private devPlan = signal<'FREE' | 'PREMIUM'>('FREE');

  /**
   * Computed: Est-ce que l'utilisateur est Premium?
   *
   * Future implementation:
   * ```typescript
   * private authStore = inject(AuthStore);
   * isPremium = computed(() => this.authStore.user()?.plan === 'PREMIUM');
   * ```
   */
  readonly isPremium = computed(() => this.devPlan() === 'PREMIUM');

  /**
   * Computed: Est-ce que l'utilisateur est Free?
   */
  readonly isFree = computed(() => this.devPlan() === 'FREE');

  /**
   * Dev only - Override du plan pour tester
   * À retirer quand User.plan sera disponible
   *
   * @param plan - Plan à définir (FREE ou PREMIUM)
   */
  setDevPlan(plan: 'FREE' | 'PREMIUM'): void {
    console.warn(
      `[DEV] Premium plan override: ${plan}. This will be removed when User.plan is available.`
    );
    this.devPlan.set(plan);
  }

  /**
   * Get current plan (for debugging)
   */
  getCurrentPlan(): 'FREE' | 'PREMIUM' {
    return this.devPlan();
  }
}