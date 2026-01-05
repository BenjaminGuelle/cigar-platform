import { Component, ChangeDetectionStrategy, input, computed, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IconDirective } from '@cigar-platform/shared/ui';
import { AROMAS } from '@cigar-platform/shared/constants';
import type { JournalTastingDto } from '@cigar-platform/types';

/**
 * Tasting Card Component
 *
 * Premium display of a single tasting in the profile journal section.
 * Features:
 * - Brand avatar (logo or gold initials fallback)
 * - High contrast user attribution
 * - Elegant inline aromas display
 *
 * Usage:
 * ```html
 * <app-tasting-card [tasting]="tasting" [showUser]="true" />
 * ```
 */
@Component({
  selector: 'app-tasting-card',
  standalone: true,
  imports: [CommonModule, RouterLink, IconDirective, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a
      [routerLink]="['/tastings', tasting().id]"
      class="block p-3 rounded-lg bg-smoke-800/50 border border-smoke-700/50 hover:border-gold-500/30 hover:bg-smoke-800 transition-all duration-200"
    >
      <div class="flex items-center gap-3">
        <!-- Brand Avatar (Logo or Gold Initials) -->
        <div class="flex-shrink-0">
          @if (tasting().brandLogoUrl && !imageError()) {
            <div class="w-10 h-10 rounded-full bg-smoke-700 flex items-center justify-center overflow-hidden ring-1 ring-smoke-600">
              <img
                [src]="tasting().brandLogoUrl"
                [alt]="tasting().brandName"
                class="w-full h-full object-contain p-1"
                (error)="onImageError()"
              />
            </div>
          } @else {
            <div class="w-10 h-10 rounded-full bg-gradient-to-br from-gold-500 to-gold-600 flex items-center justify-center shadow-lg shadow-gold-500/20">
              <span class="text-sm font-bold text-smoke-950">{{ brandInitials() }}</span>
            </div>
          }
        </div>

        <!-- Content -->
        <div class="flex-1 min-w-0">
          <!-- First Row: Cigar Name + Rating -->
          <div class="flex items-center justify-between gap-2">
            <h4 class="text-sm font-medium text-smoke-100 truncate">
              {{ tasting().cigarName }}
            </h4>
            <div class="flex items-center gap-1 text-gold-500 flex-shrink-0">
              <i name="star" class="w-3.5 h-3.5 fill-current"></i>
              <span class="text-sm font-semibold">{{ tasting().rating }}</span>
            </div>
          </div>

          <!-- Second Row: Brand + Aromas -->
          <div class="flex items-center gap-1.5 mt-0.5">
            <span class="text-xs text-smoke-300 truncate">{{ tasting().brandName }}</span>

            @if (hasAromas()) {
              <span class="text-smoke-600">·</span>
              <span class="text-xs text-smoke-400 truncate italic">{{ aromasPreview() }}</span>
            }
          </div>

          <!-- Third Row: User (if club) + Date -->
          <div class="flex items-center gap-1.5 mt-1">
            @if (showUser() && tasting().user) {
              <span class="text-[11px] text-gold-600/70">par {{ tasting().user?.displayName }}</span>
              <span class="text-smoke-600">·</span>
            }
            <span class="text-[11px] text-smoke-400">{{ tasting().date | date:'d MMM yyyy' }}</span>
          </div>
        </div>
      </div>
    </a>
  `,
})
export class TastingCardComponent {
  readonly tasting = input.required<JournalTastingDto>();
  readonly showUser = input<boolean>(false);

  // Track image loading error
  readonly #imageError = signal(false);
  readonly imageError = this.#imageError.asReadonly();

  /**
   * Get brand initials (1-2 letters)
   * "Arturo Fuente" → "AF"
   * "Cohiba" → "C"
   */
  readonly brandInitials = computed(() => {
    const name = this.tasting().brandName;
    if (!name) return '?';

    const words = name.trim().split(/\s+/);
    if (words.length >= 2) {
      return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
    }
    return words[0].charAt(0).toUpperCase();
  });

  /**
   * Check if tasting has aromas
   */
  readonly hasAromas = computed(() => {
    const aromas = this.tasting().aromas;
    return aromas && aromas.length > 0;
  });

  /**
   * Get aromas preview (comma separated, truncated, translated to French)
   */
  readonly aromasPreview = computed(() => {
    const aromas = this.tasting().aromas;
    if (!aromas || aromas.length === 0) return '';

    // Translate aroma IDs to French labels
    const translatedAromas = aromas.slice(0, 2).map(aromaId => {
      const aroma = AROMAS.find(a => a.id === aromaId);
      return aroma?.label ?? aromaId;
    });

    const preview = translatedAromas.join(', ');
    return aromas.length > 2 ? `${preview}...` : preview;
  });

  /**
   * Handle image load error
   */
  onImageError(): void {
    this.#imageError.set(true);
  }
}