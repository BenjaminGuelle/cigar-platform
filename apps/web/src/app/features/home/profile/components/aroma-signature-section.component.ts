import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IconDirective, PageSectionComponent, ButtonComponent, SkeletonComponent } from '@cigar-platform/shared/ui';
import { AROMAS, TASTES } from '@cigar-platform/shared/constants';
import type { AromaStatDto } from '@cigar-platform/types';

/**
 * Map for translating aroma/taste IDs to French labels
 */
const FLAVOR_LABELS_MAP = new Map<string, string>([
  ...AROMAS.map(a => [a.id, a.label] as const),
  ...TASTES.map(t => [t.id, t.label] as const),
]);

/**
 * Get French label for a flavor ID
 * Falls back to the ID if not found (capitalize first letter)
 */
function getFlavorLabel(id: string): string {
  const label = FLAVOR_LABELS_MAP.get(id);
  if (label) return label;
  // Fallback: capitalize first letter
  return id.charAt(0).toUpperCase() + id.slice(1).replace(/_/g, ' ');
}

/**
 * Aroma Signature Section Component
 *
 * Displays the aromatic signature with top aromas and their percentages.
 * Shows an empty state with upgrade CTA for non-Premium users.
 *
 * Premium users see: Horizontal bars with aroma names and percentages
 * Non-Premium users see: Empty state with "Passer Premium" CTA
 */
@Component({
  selector: 'app-aroma-signature-section',
  standalone: true,
  imports: [CommonModule, RouterLink, IconDirective, PageSectionComponent, ButtonComponent, SkeletonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ui-page-section title="Signature Aromatique" [subtitle]="subtitleText()">
      @if (loading()) {
        <!-- Skeleton State -->
        <div class="space-y-3">
          @for (i of [1, 2, 3, 4, 5]; track i) {
            <div class="space-y-1">
              <div class="flex items-center justify-between">
                <ui-skeleton variant="text" width="80px" height="16px" />
                <ui-skeleton variant="text" width="32px" height="16px" />
              </div>
              <ui-skeleton variant="rounded" width="100%" height="8px" />
            </div>
          }
        </div>
        <div class="mt-4 flex justify-center">
          <ui-skeleton variant="text" width="180px" height="12px" />
        </div>
      } @else if (showUpgradeCta()) {
        <!-- Empty State: Not Premium or No Data -->
        <div class="flex flex-col items-center justify-center py-8 px-4 rounded-lg bg-smoke-800 border border-smoke-700 text-center">
          <div class="w-12 h-12 rounded-full bg-smoke-700 flex items-center justify-center mb-4">
            <i name="sparkles" class="w-6 h-6 text-smoke-500"></i>
          </div>
          <h4 class="text-sm font-medium text-smoke-200 mb-2">
            {{ emptyStateTitle() }}
          </h4>
          <p class="text-xs text-smoke-400 max-w-xs mb-4">
            {{ emptyStateDescription() }}
          </p>
          @if (!isPremium()) {
            <a routerLink="/settings" fragment="premium">
              <ui-button size="sm" variant="secondary">
                Passer Premium
              </ui-button>
            </a>
          }
        </div>
      } @else {
        <!-- Aroma Bars -->
        <div class="space-y-3">
          @for (aroma of aromasWithLabels(); track aroma.name) {
            <div class="space-y-1">
              <div class="flex items-center justify-between">
                <span class="text-sm text-smoke-200">{{ aroma.label }}</span>
                <span class="text-sm font-medium text-gold-500">{{ aroma.percentage }}%</span>
              </div>
              <div class="h-2 bg-smoke-700 rounded-full overflow-hidden">
                <div
                  class="h-full bg-gradient-to-r from-gold-600 to-gold-500 rounded-full transition-all duration-500"
                  [style.width.%]="aroma.percentage"
                ></div>
              </div>
            </div>
          }
        </div>

        <!-- Hint text -->
        <p class="text-xs text-smoke-400 mt-4 text-center">
          {{ hintText() }}
        </p>
      }
    </ui-page-section>
  `,
})
export class AromaSignatureSectionComponent {
  readonly context = input<'solo' | 'club'>('solo');
  readonly loading = input<boolean>(false);
  readonly isPremium = input<boolean>(false);
  readonly hasChronicData = input<boolean>(false);
  readonly aromas = input<AromaStatDto[] | null>(null);
  readonly chronicTastingCount = input<number>(0);

  /**
   * Transform aromas with French labels
   */
  readonly aromasWithLabels = computed(() => {
    const aromasList = this.aromas();
    if (!aromasList) return [];
    return aromasList.map(aroma => ({
      ...aroma,
      label: getFlavorLabel(aroma.name),
    }));
  });

  readonly showUpgradeCta = computed(() => {
    // Solo: Show CTA if not Premium OR no chronic data
    if (this.context() === 'solo') {
      return !this.isPremium() || !this.hasChronicData() || !this.aromas() || this.aromas()?.length === 0;
    }
    // Club: Show CTA only if no chronic data (no mention of Premium)
    return !this.hasChronicData() || !this.aromas() || this.aromas()?.length === 0;
  });

  readonly emptyStateTitle = computed(() => {
    if (this.context() === 'solo') {
      if (!this.isPremium()) {
        return 'Fonctionnalité Premium';
      }
      return 'Aucune donnée';
    }
    return 'Aucune donnée';
  });

  readonly emptyStateDescription = computed(() => {
    if (this.context() === 'solo') {
      if (!this.isPremium()) {
        return 'Passez Premium pour débloquer vos fiches de dégustation chroniques et découvrir votre signature aromatique.';
      }
      return 'Complétez des fiches de dégustation chroniques pour découvrir votre signature aromatique.';
    }
    return 'Les membres Premium peuvent contribuer des dégustations chroniques pour révéler la signature du club.';
  });

  readonly hintText = computed(() => {
    if (this.context() === 'club') {
      const count = this.chronicTastingCount();
      return `Basé sur ${count} dégustation${count > 1 ? 's' : ''} chronique${count > 1 ? 's' : ''} des membres Premium`;
    }
    return 'Basé sur vos dégustations chroniques';
  });

  readonly subtitleText = computed(() => {
    return this.context() === 'club'
      ? 'L\'empreinte aromatique du club'
      : 'Les arômes qui vous définissent';
  });
}