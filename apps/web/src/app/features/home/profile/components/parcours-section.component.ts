import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconDirective, PageSectionComponent } from '@cigar-platform/shared/ui';

/**
 * Parcours Section Component
 *
 * Displays the "Mon Parcours" stats section with 3 key metrics.
 * Adapts labels based on context (solo vs club).
 *
 * Solo context:
 * - Dégustations | Marques | Terroirs
 *
 * Club context:
 * - Dégustations | Membres | Events
 */
@Component({
  selector: 'app-parcours-section',
  standalone: true,
  imports: [CommonModule, IconDirective, PageSectionComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ui-page-section [title]="context() === 'solo' ? 'Mon Parcours' : 'Notre Parcours'">
      <div class="grid grid-cols-3 gap-3 md:gap-4">
        <!-- Stat 1: Dégustations -->
        <div class="flex flex-col items-center p-3 md:p-4 rounded-lg bg-smoke-800 border border-smoke-700">
          <i name="flame" class="w-5 h-5 md:w-6 md:h-6 text-gold-500 mb-2"></i>
          <span class="text-xl md:text-2xl font-semibold text-smoke-50">{{ stat1Value() }}</span>
          <span class="text-xs md:text-sm text-smoke-400 text-center">Dégustations</span>
        </div>

        <!-- Stat 2: Marques (Solo) or Membres (Club) -->
        <div class="flex flex-col items-center p-3 md:p-4 rounded-lg bg-smoke-800 border border-smoke-700">
          <i [name]="context() === 'solo' ? 'box' : 'users'" class="w-5 h-5 md:w-6 md:h-6 text-gold-500 mb-2"></i>
          <span class="text-xl md:text-2xl font-semibold text-smoke-50">{{ stat2Value() }}</span>
          <span class="text-xs md:text-sm text-smoke-400 text-center">
            {{ context() === 'solo' ? 'Marques' : 'Membres' }}
          </span>
        </div>

        <!-- Stat 3: Terroirs (Solo) or Events (Club) -->
        <div class="flex flex-col items-center p-3 md:p-4 rounded-lg bg-smoke-800 border border-smoke-700">
          <i [name]="context() === 'solo' ? 'globe' : 'calendar'" class="w-5 h-5 md:w-6 md:h-6 text-gold-500 mb-2"></i>
          <span class="text-xl md:text-2xl font-semibold text-smoke-50">{{ stat3Value() }}</span>
          <span class="text-xs md:text-sm text-smoke-400 text-center">
            {{ context() === 'solo' ? 'Terroirs' : 'Events' }}
          </span>
        </div>
      </div>
    </ui-page-section>
  `,
})
export class ParcoursSectionComponent {
  readonly context = input<'solo' | 'club'>('solo');
  readonly stat1Value = input<number>(0);
  readonly stat2Value = input<number>(0);
  readonly stat3Value = input<number>(0);
}