import { Component, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  IconDirective,
  ButtonComponent,
} from '@cigar-platform/shared/ui';
import { injectTastingStore } from '../../../core/stores/tasting.store';
import { ContextStore } from '../../../core/stores/context.store';
import type { TastingResponseDto } from '@cigar-platform/types';

/**
 * Tastings List Page
 *
 * Route: /tastings
 * Accessible: Authenticated users
 *
 * Features:
 * - View all completed tastings (paginated)
 * - Context-aware: Solo shows user's tastings, Club shows club's tastings
 * - Click on tasting to view details
 * - Create new tasting CTA
 *
 * Architecture: ALL STARS
 */
@Component({
  selector: 'app-tastings-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    IconDirective,
    ButtonComponent,
    DatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mx-auto max-w-4xl space-y-6 md:space-y-8 px-4 md:px-6 py-6 md:py-8">
      <!-- Header -->
      <div class="flex items-center justify-between gap-4">
        <div>
          <h1 class="font-display text-3xl md:text-4xl text-gold-500">
            {{ pageTitle() }}
          </h1>
          <p class="text-smoke-400 mt-1">{{ pageSubtitle() }}</p>
        </div>

        <!-- New Tasting Button -->
        <a routerLink="/tasting/new">
          <ui-button icon="plus" size="sm">
            Nouvelle
          </ui-button>
        </a>
      </div>

      <!-- Loading State -->
      @if (loading()) {
        <div class="flex justify-center py-12">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-500"></div>
        </div>
      }

      <!-- Error State -->
      @if (error()) {
        <div class="text-center py-12">
          <i name="alert-circle" class="w-12 h-12 text-red-500 mx-auto mb-4"></i>
          <p class="text-smoke-400">Une erreur est survenue</p>
        </div>
      }

      <!-- Tastings List -->
      @if (!loading() && !error()) {
        @if (tastings().length > 0) {
          <div class="space-y-3">
            @for (tasting of tastings(); track tasting.id) {
              <a
                [routerLink]="['/tastings', tasting.id]"
                class="block p-4 rounded-lg bg-smoke-800 border border-smoke-700 hover:border-smoke-600 transition-colors"
              >
                <div class="flex items-start gap-3">
                  <!-- Brand Logo or Placeholder -->
                  <div class="flex-shrink-0 w-12 h-12 rounded bg-smoke-700 flex items-center justify-center overflow-hidden">
                    @if (tasting.cigar?.brand?.logoUrl) {
                      <img
                        [src]="tasting.cigar.brand.logoUrl"
                        [alt]="tasting.cigar.brand.name"
                        class="w-full h-full object-contain"
                      />
                    } @else {
                      <i name="flame" class="w-6 h-6 text-smoke-500"></i>
                    }
                  </div>

                  <!-- Content -->
                  <div class="flex-1 min-w-0">
                    <!-- Cigar Name -->
                    <h3 class="text-base font-medium text-smoke-100 truncate">
                      {{ tasting.cigar?.name ?? 'Cigare inconnu' }}
                    </h3>

                    <!-- Brand Name -->
                    <p class="text-sm text-smoke-400 truncate">
                      {{ tasting.cigar?.brand?.name ?? '' }}
                    </p>

                    <!-- Context Info -->
                    @if (tasting.situation || tasting.pairing) {
                      <div class="flex flex-wrap gap-2 mt-2">
                        @if (tasting.situation) {
                          <span class="inline-flex items-center px-2 py-0.5 rounded text-xs bg-smoke-700 text-smoke-300">
                            {{ tasting.situation }}
                          </span>
                        }
                        @if (tasting.pairing) {
                          <span class="inline-flex items-center px-2 py-0.5 rounded text-xs bg-smoke-700 text-smoke-300">
                            {{ tasting.pairing }}
                          </span>
                        }
                      </div>
                    }
                  </div>

                  <!-- Rating & Date -->
                  <div class="flex-shrink-0 text-right">
                    @if (tasting.rating) {
                      <div class="flex items-center gap-1 text-gold-500">
                        <i name="star" class="w-4 h-4 fill-current"></i>
                        <span class="text-sm font-semibold">{{ tasting.rating }}</span>
                      </div>
                    }
                    <p class="text-xs text-smoke-500 mt-1">
                      {{ tasting.date | date:'dd/MM/yy' }}
                    </p>
                  </div>
                </div>
              </a>
            }
          </div>

          <!-- Load More (TODO: implement pagination) -->
          @if (hasMore()) {
            <div class="text-center pt-4">
              <ui-button variant="ghost" size="sm" [disabled]="true">
                Charger plus (bientot)
              </ui-button>
            </div>
          }
        } @else {
          <!-- Empty State -->
          <div class="flex flex-col items-center justify-center py-16 px-4 rounded-lg bg-smoke-800 border border-smoke-700 text-center">
            <div class="w-16 h-16 rounded-full bg-smoke-700 flex items-center justify-center mb-4">
              <i name="book-open" class="w-8 h-8 text-smoke-500"></i>
            </div>
            <h3 class="text-lg font-medium text-smoke-200 mb-2">
              {{ emptyStateTitle() }}
            </h3>
            <p class="text-sm text-smoke-400 max-w-sm mb-6">
              {{ emptyStateDescription() }}
            </p>
            <a routerLink="/tasting/new">
              <ui-button icon="plus">
                Commencer une dégustation
              </ui-button>
            </a>
          </div>
        }
      }
    </div>
  `,
})
export class TastingsListPage {
  readonly #tastingStore = injectTastingStore();
  readonly #contextStore = inject(ContextStore);

  // Context
  readonly context = computed(() => this.#contextStore.context());
  readonly isClubContext = computed(() => this.context().type === 'club');
  readonly currentClubId = computed(() => {
    const ctx = this.context();
    return ctx.type === 'club' ? ctx.clubId ?? '' : '';
  });

  // Queries - created at class level (injection context)
  readonly #myTastingsQuery = this.#tastingStore.myTastings;
  readonly #clubTastingsQuery = this.#tastingStore.getTastingsByClub(() => this.currentClubId());

  // Query state - select based on context
  readonly loading = computed(() => {
    return this.isClubContext()
      ? this.#clubTastingsQuery.loading()
      : this.#myTastingsQuery.loading();
  });

  readonly error = computed(() => {
    return this.isClubContext()
      ? this.#clubTastingsQuery.error()
      : this.#myTastingsQuery.error();
  });

  // Tastings data - filter out DRAFT tastings
  readonly tastings = computed(() => {
    let data: unknown;

    if (this.isClubContext()) {
      data = this.#clubTastingsQuery.data();
    } else {
      data = this.#myTastingsQuery.data();
    }

    // Handle both paginated and array response
    let tastings: TastingResponseDto[] = [];
    if (data && typeof data === 'object' && 'data' in data) {
      tastings = (data as { data: TastingResponseDto[] }).data ?? [];
    } else if (Array.isArray(data)) {
      tastings = data;
    }

    // Filter out DRAFT tastings - only show COMPLETED
    return tastings.filter(t => t.status === 'COMPLETED');
  });

  // Pagination - only applicable for my tastings (paginated)
  readonly hasMore = computed(() => {
    if (this.isClubContext()) {
      return false; // Club tastings are not paginated
    }
    const data = this.#myTastingsQuery.data();
    if (data && 'meta' in data) {
      const meta = data.meta;
      return (meta.page * meta.limit) < meta.total;
    }
    return false;
  });

  // Page content based on context
  readonly pageTitle = computed(() =>
    this.isClubContext() ? 'Dégustations du Club' : 'Mes Dégustations'
  );

  readonly pageSubtitle = computed(() => {
    const count = this.tastings().length;
    if (count === 0) return 'Aucune dégustation';
    return `${count} dégustation${count > 1 ? 's' : ''}`;
  });

  readonly emptyStateTitle = computed(() =>
    this.isClubContext()
      ? 'Aucune dégustation partagée'
      : 'Aucune dégustation'
  );

  readonly emptyStateDescription = computed(() =>
    this.isClubContext()
      ? 'Les membres peuvent partager leurs dégustations avec le club pour les retrouver ici.'
      : 'Commencez à déguster pour construire votre journal personnel et suivre votre parcours.'
  );
}