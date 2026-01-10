import {
  Component,
  input,
  output,
  computed,
  effect,
  viewChild,
  ElementRef,
  OnDestroy,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import type { TastingResponseDto } from '@cigar-platform/types';
import { TastingCardComponent } from '../tasting-card/tasting-card.component';
import { ButtonComponent } from '../button/button.component';

/**
 * Tastings Grid Component
 *
 * Shared component for displaying tastings in an Instagram-style grid.
 * Includes infinite scroll, loading states, and empty state handling.
 *
 * Features:
 * - Responsive grid (3 cols mobile, 5 cols desktop)
 * - Loading skeleton state
 * - Empty state with customizable message and optional CTA button
 * - Built-in infinite scroll with IntersectionObserver
 * - Loading more indicator
 *
 * @example
 * ```html
 * <ui-tastings-grid
 *   [tastings]="tastings()"
 *   [loading]="loading()"
 *   [loadingMore]="loadingMore()"
 *   [hasMore]="hasMore()"
 *   [showUsername]="true"
 *   emptyMessage="Aucune dégustation"
 *   emptySubMessage="Commencez à déguster"
 *   [showAddButton]="isOwner()"
 *   addButtonLabel="Ajouter ma première note"
 *   (loadMore)="onLoadMore()"
 *   (cardClick)="onTastingClick($event)"
 *   (addClick)="onAddClick()"
 * />
 * ```
 */
@Component({
  selector: 'ui-tastings-grid',
  standalone: true,
  imports: [CommonModule, TastingCardComponent, ButtonComponent],
  template: `
    <!-- Loading skeleton grid -->
    @if (loading()) {
      <div class="mt-6 grid grid-cols-3 md:grid-cols-5 gap-2">
        @for (slot of skeletonSlots; track slot) {
          <div class="aspect-4/5 rounded-sm bg-smoke-600 animate-pulse"></div>
        }
      </div>
    } @else if (tastings().length === 0) {
      <!-- Empty state -->
      <div class="mt-8 flex flex-col items-center justify-center py-12 gap-4">
        <div class="text-center">
          <p class="text-smoke-300 text-sm">{{ emptyMessage() }}</p>
          @if (emptySubMessage()) {
            <p class="text-smoke-400 text-xs mt-1">{{ emptySubMessage() }}</p>
          }
        </div>
        @if (showAddButton()) {
          <ui-button
            variant="outline"
            icon="flame"
            size="sm"
            (clicked)="addClick.emit()"
          >
            {{ addButtonLabel() }}
          </ui-button>
        }
      </div>
    } @else {
      <!-- Tastings grid -->
      <div class="mt-6 grid grid-cols-3 md:grid-cols-5 gap-2">
        @for (tasting of tastings(); track tasting.id) {
          <ui-tasting-card
            [tasting]="tasting"
            [showUsername]="showUsername()"
            (cardClick)="cardClick.emit($event)"
          />
        }
      </div>

      <!-- Loading more indicator -->
      @if (loadingMore()) {
        <div class="mt-4 flex justify-center">
          <div class="w-6 h-6 border-2 border-gold-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      }

      <!-- Scroll sentinel for infinite scroll -->
      @if (hasMore()) {
        <div #scrollSentinel class="h-4"></div>
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TastingsGridComponent implements OnDestroy {
  // Inputs
  readonly tastings = input<TastingResponseDto[]>([]);
  readonly loading = input<boolean>(false);
  readonly loadingMore = input<boolean>(false);
  readonly hasMore = input<boolean>(false);
  readonly showUsername = input<boolean>(false);

  // Empty state config
  readonly emptyMessage = input<string>('Aucune dégustation pour le moment');
  readonly emptySubMessage = input<string | null>(null);
  readonly showAddButton = input<boolean>(false);
  readonly addButtonLabel = input<string>('Ajouter une dégustation');

  // Outputs
  readonly loadMore = output<void>();
  readonly cardClick = output<string>();
  readonly addClick = output<void>();

  // Skeleton slots for loading state
  readonly skeletonSlots = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  // Infinite scroll observer
  #intersectionObserver: IntersectionObserver | null = null;
  readonly scrollSentinel = viewChild<ElementRef<HTMLDivElement>>('scrollSentinel');

  constructor() {
    // Effect to setup/cleanup IntersectionObserver when sentinel appears/disappears
    effect(() => {
      const sentinel = this.scrollSentinel();

      // Cleanup previous observer
      this.#intersectionObserver?.disconnect();
      this.#intersectionObserver = null;

      // Setup new observer if sentinel exists
      if (sentinel) {
        this.#intersectionObserver = new IntersectionObserver(
          (entries) => {
            const entry = entries[0];
            if (entry.isIntersecting && this.hasMore() && !this.loadingMore()) {
              this.loadMore.emit();
            }
          },
          { threshold: 0.1 }
        );
        this.#intersectionObserver.observe(sentinel.nativeElement);
      }
    });
  }

  ngOnDestroy(): void {
    this.#intersectionObserver?.disconnect();
  }
}