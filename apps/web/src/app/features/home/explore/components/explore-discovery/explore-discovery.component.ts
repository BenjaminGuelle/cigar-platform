import {
  Component,
  input,
  output,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import type { DiscoverCigarDto, DiscoverTastingDto } from '@cigar-platform/types';
import { IconDirective, SkeletonComponent } from '@cigar-platform/shared/ui';

/**
 * Explore Discovery Component
 *
 * Displays discovery content when search is not active:
 * - Recent cigars added to the platform
 * - Recent tastings from the community
 *
 * Used in: ExplorePage (discovery mode)
 */
@Component({
  selector: 'app-explore-discovery',
  standalone: true,
  imports: [CommonModule, IconDirective, SkeletonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="pt-2">
      <!-- Skeleton Loading State -->
      @if (loading()) {
        <div class="space-y-6">
          <!-- Skeleton: Nouveaux cigares -->
          <section>
            <ui-skeleton size="text-sm" class="mb-3" />
            <div class="space-y-2.5">
              @for (i of [1, 2, 3]; track i) {
                <div class="flex items-center gap-2">
                  <ui-skeleton size="text-md" />
                  <ui-skeleton size="text-xs" />
                </div>
              }
            </div>
          </section>

          <!-- Skeleton: Dernières dégustations -->
          <section>
            <ui-skeleton size="text-sm" class="mb-3" />
            <div class="space-y-3">
              @for (i of [1, 2, 3, 4, 5, 6]; track i) {
                <div>
                  <ui-skeleton size="text-md" class="mb-1" />
                  <div class="flex items-center gap-2">
                    <ui-skeleton size="text-xs" />
                    <ui-skeleton size="text-xs" />
                  </div>
                </div>
              }
            </div>
          </section>
        </div>
      }

      @if (!loading()) {
        <!-- Section: Nouveaux cigares -->
        @if (cigars().length > 0) {
          <section class="mb-6">
            <h2 class="text-xs font-semibold text-smoke-500 uppercase tracking-wider mb-3">
              Nouveaux cigares
            </h2>
            <div class="space-y-2.5">
              @for (cigar of cigars(); track cigar.id) {
                <div
                  class="flex items-baseline gap-2 cursor-pointer group"
                  (click)="cigarClick.emit(cigar)"
                >
                  <span class="text-sm text-smoke-200 group-hover:text-gold-500 transition-colors font-medium">
                    {{ cigar.name }}
                  </span>
                  <span class="text-smoke-600">·</span>
                  <span class="text-xs text-smoke-500">{{ cigar.brandName }}</span>
                </div>
              }
            </div>
          </section>
        }

        <!-- Section: Dernières dégustations -->
        @if (tastings().length > 0) {
          <section class="mb-6">
            <h2 class="text-xs font-semibold text-smoke-500 uppercase tracking-wider mb-3">
              Dernières dégustations
            </h2>
            <div class="space-y-3">
              @for (tasting of tastings(); track tasting.id) {
                <div
                  class="cursor-pointer group"
                  (click)="tastingClick.emit(tasting)"
                >
                  <p class="text-sm text-smoke-200 group-hover:text-gold-500 transition-colors font-medium truncate">
                    {{ tasting.cigarName }}
                  </p>
                  <div class="flex items-center gap-1.5 mt-0.5">
                    <i uiIcon name="star" class="w-3 h-3 text-gold-500"></i>
                    <span class="text-xs text-smoke-300">{{ tasting.rating }}</span>
                    <span class="text-smoke-600">·</span>
                    <span class="text-xs text-smoke-500">@{{ tasting.username }}</span>
                    <span class="text-smoke-600">·</span>
                    <span class="text-xs text-smoke-600">{{ formatRelativeTime(tasting.createdAt) }}</span>
                  </div>
                </div>
              }
            </div>
          </section>
        }

        <!-- Empty State -->
        @if (cigars().length === 0 && tastings().length === 0) {
          <div class="py-8 text-center">
            <p class="text-sm text-smoke-500">Aucun contenu à découvrir pour le moment</p>
          </div>
        }
      }
    </div>
  `,
})
export class ExploreDiscoveryComponent {
  /** Loading state */
  readonly loading = input.required<boolean>();

  /** Recent cigars */
  readonly cigars = input.required<DiscoverCigarDto[]>();

  /** Recent tastings */
  readonly tastings = input.required<DiscoverTastingDto[]>();

  /** Emitted when a cigar is clicked */
  readonly cigarClick = output<DiscoverCigarDto>();

  /** Emitted when a tasting is clicked */
  readonly tastingClick = output<DiscoverTastingDto>();

  /**
   * Format relative time for display (e.g., "2h", "3j")
   */
  formatRelativeTime(date: Date | string): string {
    const now = new Date();
    const pastDate = new Date(date);
    const diffMs = now.getTime() - pastDate.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) {
      return `${Math.max(1, diffMins)}m`;
    } else if (diffHours < 24) {
      return `${diffHours}h`;
    } else {
      return `${diffDays}j`;
    }
  }
}