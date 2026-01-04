import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageSectionComponent } from '@cigar-platform/shared/ui';
import type { TerroirStatDto } from '@cigar-platform/types';

/**
 * Terroirs Section Component
 *
 * Displays the top terroirs explored with country flags and percentages.
 * Only shown for Premium users with chronic data.
 * Hidden completely for non-Premium users (no empty state).
 */
@Component({
  selector: 'app-terroirs-section',
  standalone: true,
  imports: [CommonModule, PageSectionComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (shouldShow()) {
      <ui-page-section title="Terroirs Explorés">
        <div class="space-y-3">
          @for (terroir of terroirs(); track terroir.country; let i = $index) {
            <div class="flex items-center gap-3 p-3 rounded-lg bg-smoke-800 border border-smoke-700">
              <!-- Rank -->
              <span class="w-6 h-6 flex items-center justify-center rounded-full bg-smoke-700 text-xs font-semibold text-smoke-300">
                {{ i + 1 }}
              </span>

              <!-- Flag -->
              <span
                class="fi fis rounded-sm"
                [class]="'fi-' + terroir.code"
                style="font-size: 1.5rem; line-height: 1;"
              ></span>

              <!-- Country Name -->
              <span class="flex-1 text-sm text-smoke-200">{{ terroir.country }}</span>

              <!-- Percentage -->
              <span class="text-sm font-medium text-gold-500">{{ terroir.percentage }}%</span>
            </div>
          }
        </div>
      </ui-page-section>
    }
  `,
})
export class TerroirsSectionComponent {
  readonly context = input<'solo' | 'club'>('solo');
  readonly isPremium = input<boolean>(false);
  readonly hasChronicData = input<boolean>(false);
  readonly terroirs = input<TerroirStatDto[] | null>(null);

  readonly shouldShow = computed(() => {
    // Solo: Only show if Premium AND has chronic data AND has terroirs
    if (this.context() === 'solo') {
      return this.isPremium() && this.hasChronicData() && this.terroirs() && this.terroirs()!.length > 0;
    }
    // Club: Only show if has chronic data AND has terroirs (no Premium check on club level)
    return this.hasChronicData() && this.terroirs() && this.terroirs()!.length > 0;
  });
}