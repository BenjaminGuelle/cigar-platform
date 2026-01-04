import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IconDirective, PageSectionComponent, ButtonComponent } from '@cigar-platform/shared/ui';
import type { AromaStatDto } from '@cigar-platform/types';

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
  imports: [CommonModule, RouterLink, IconDirective, PageSectionComponent, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ui-page-section title="Signature Aromatique">
      @if (showUpgradeCta()) {
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
          @for (aroma of aromas(); track aroma.name) {
            <div class="space-y-1">
              <div class="flex items-center justify-between">
                <span class="text-sm text-smoke-200">{{ aroma.name }}</span>
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

        <!-- Hint for club context -->
        @if (context() === 'club' && chronicTastingCount() > 0) {
          <p class="text-xs text-smoke-500 mt-4 text-center">
            Basé sur {{ chronicTastingCount() }} dégustations chroniques des membres Premium
          </p>
        }
      }
    </ui-page-section>
  `,
})
export class AromaSignatureSectionComponent {
  readonly context = input<'solo' | 'club'>('solo');
  readonly isPremium = input<boolean>(false);
  readonly hasChronicData = input<boolean>(false);
  readonly aromas = input<AromaStatDto[] | null>(null);
  readonly chronicTastingCount = input<number>(0);

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
}