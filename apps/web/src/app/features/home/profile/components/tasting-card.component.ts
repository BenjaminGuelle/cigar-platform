import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IconDirective } from '@cigar-platform/shared/ui';
import type { JournalTastingDto } from '@cigar-platform/types';

/**
 * Tasting Card Component
 *
 * Displays a single tasting in the profile journal section.
 * Shows cigar name, brand, rating, date, and optional aromas.
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
      class="block p-4 rounded-lg bg-smoke-800 border border-smoke-700 hover:border-smoke-600 transition-colors"
    >
      <div class="flex items-start gap-3">
        <!-- Brand Logo or Placeholder -->
        <div class="flex-shrink-0 w-10 h-10 rounded bg-smoke-700 flex items-center justify-center overflow-hidden">
          @if (tasting().brandLogoUrl) {
            <img
              [src]="tasting().brandLogoUrl"
              [alt]="tasting().brandName"
              class="w-full h-full object-contain"
            />
          } @else {
            <i name="box" class="w-5 h-5 text-smoke-500"></i>
          }
        </div>

        <!-- Content -->
        <div class="flex-1 min-w-0">
          <!-- Cigar Name -->
          <h4 class="text-sm font-medium text-smoke-100 truncate">
            {{ tasting().cigarName }}
          </h4>

          <!-- Brand Name -->
          <p class="text-xs text-smoke-400 truncate">{{ tasting().brandName }}</p>

          <!-- User (for club context) -->
          @if (showUser() && tasting().user) {
            <p class="text-xs text-smoke-500 mt-1">
              par {{ tasting().user?.displayName }}
            </p>
          }

          <!-- Aromas -->
          @if (tasting().aromas && (tasting().aromas?.length ?? 0) > 0) {
            <div class="flex flex-wrap gap-1 mt-2">
              @for (aroma of tasting().aromas ?? []; track aroma) {
                <span class="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-smoke-700 text-smoke-300">
                  {{ aroma }}
                </span>
              }
            </div>
          }
        </div>

        <!-- Rating & Date -->
        <div class="flex-shrink-0 text-right">
          <div class="flex items-center gap-1 text-gold-500">
            <i name="star" class="w-4 h-4 fill-current"></i>
            <span class="text-sm font-semibold">{{ tasting().rating }}</span>
          </div>
          <p class="text-xs text-smoke-500 mt-1">
            {{ tasting().date | date:'dd/MM/yy' }}
          </p>
        </div>
      </div>
    </a>
  `,
})
export class TastingCardComponent {
  readonly tasting = input.required<JournalTastingDto>();
  readonly showUser = input<boolean>(false);
}