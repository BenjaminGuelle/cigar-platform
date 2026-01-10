import {
  Component,
  computed,
  inject,
  effect,
  ChangeDetectionStrategy,
  ElementRef,
  viewChild,
  DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import type { DiscoverCigarDto } from '@cigar-platform/types';
import { SkeletonComponent, TastingCardComponent } from '@cigar-platform/shared/ui';
import { injectDiscoverStore } from '../../../../../core/stores/discover.store';

/**
 * Explore Discovery Component
 *
 * Displays discovery content when search is not active:
 * - Recent cigars added to the platform (3 items)
 * - Public tastings from the community (paginated, infinite scroll)
 *
 * Owns its own data via DiscoverStore (ALL STARS pattern)
 *
 * Used in: ExplorePage (discovery mode)
 */
@Component({
  selector: 'app-explore-discovery',
  standalone: true,
  imports: [CommonModule, SkeletonComponent, TastingCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="pt-2 animate-fade-in">
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

          <!-- Skeleton: Dernières dégustations (grid) -->
          <section>
            <ui-skeleton size="text-sm" class="mb-3" />
            <div class="grid grid-cols-3 gap-2">
              @for (i of [1, 2, 3, 4, 5, 6, 7, 8, 9]; track i) {
                <div class="aspect-4/5 rounded-sm bg-smoke-800"></div>
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
                  (click)="handleCigarClick(cigar)"
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

        <!-- Section: Dernières dégustations (grid with infinite scroll) -->
        @if (tastings().length > 0) {
          <section class="mb-6">
            <h2 class="text-xs font-semibold text-smoke-500 uppercase tracking-wider mb-3">
              Dernières dégustations
            </h2>
            <div class="grid grid-cols-3 gap-2">
              @for (tasting of tastings(); track tasting.id) {
                <ui-tasting-card
                  [tasting]="tasting"
                  [showUsername]="true"
                  (cardClick)="handleTastingClick($event)"
                />
              }
            </div>

            <!-- Load More Trigger (intersection observer target) -->
            @if (hasMore()) {
              <div #loadMoreTrigger class="h-px"></div>
            }

            <!-- Loading more indicator -->
            @if (loadingMore()) {
              <div class="grid grid-cols-3 gap-2 mt-2">
                @for (i of [1, 2, 3]; track i) {
                  <div class="aspect-4/5 rounded-sm bg-smoke-800 animate-pulse"></div>
                }
              </div>
            }
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
  readonly #router = inject(Router);
  readonly #discoverStore = injectDiscoverStore();

  // Queries
  readonly #discoveryQuery = this.#discoverStore.getDiscoveryContent();
  readonly #tastingsQuery = this.#discoverStore.getPublicTastings();

  // Load more trigger element
  readonly loadMoreTrigger = viewChild<ElementRef<HTMLDivElement>>('loadMoreTrigger');

  // Intersection observer for infinite scroll (created lazily)
  #observer: IntersectionObserver | null = null;

  // Computed signals for UI
  readonly loading = computed(
    () => this.#discoveryQuery.loading() || this.#tastingsQuery.query.loading()
  );

  readonly cigars = computed(() => this.#discoveryQuery.data()?.recentCigars ?? []);

  readonly tastings = this.#tastingsQuery.allTastings;
  readonly hasMore = this.#tastingsQuery.hasMore;
  readonly loadingMore = this.#tastingsQuery.loadingMore;

  constructor() {
    const destroyRef = inject(DestroyRef);

    // Watch for trigger element changes and setup observer lazily
    effect(() => {
      const trigger = this.loadMoreTrigger();
      if (!trigger?.nativeElement) return;

      // Create observer lazily on first trigger appearance
      if (!this.#observer) {
        this.#observer = new IntersectionObserver(
          (entries) => {
            const [entry] = entries;
            if (entry?.isIntersecting && this.hasMore() && !this.loadingMore()) {
              void this.#tastingsQuery.loadMore();
            }
          },
          {
            rootMargin: '100px',
            threshold: 0,
          }
        );
      }

      // Observe the trigger element
      this.#observer.observe(trigger.nativeElement);
    });

    // Cleanup observer on destroy
    destroyRef.onDestroy(() => {
      this.#observer?.disconnect();
    });
  }

  /**
   * Navigate to cigar page
   */
  handleCigarClick(cigar: DiscoverCigarDto): void {
    void this.#router.navigate(['/cigar', cigar.slug]);
  }

  /**
   * Navigate to tasting page
   */
  handleTastingClick(tastingId: string): void {
    void this.#router.navigate(['/tastings', tastingId]);
  }
}