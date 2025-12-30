import { Component, input, output, signal, computed, effect, inject, WritableSignal, Signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { injectSearchStore } from '../../../core/stores/search.store';
import { AuthService } from '../../../core/services/auth.service';
import { GlobalSearchModalComponent } from '@cigar-platform/shared/ui';
import type { SearchResultDto } from '@cigar-platform/types';

/**
 * Global Search Component (Smart Wrapper)
 *
 * Smart component that wraps GlobalSearchModal (dumb component)
 *
 * ALL STARS Architecture ⭐
 * - Uses search.store (not service)
 * - Reactive with getter functions
 * - Query layer for caching
 * - Debounced search (300ms)
 *
 * Features:
 * - Omnisearch with prefix filtering (@username, #slug)
 * - Grouped results (brands, cigars, clubs, users)
 * - Keyboard navigation
 * - Smart caching (5 min stale time)
 *
 * @example
 * ```html
 * <app-global-search
 *   [isOpen]="searchModalOpen()"
 *   (close)="searchModalOpen.set(false)"
 * />
 * ```
 */
@Component({
  selector: 'app-global-search',
  standalone: true,
  imports: [CommonModule, GlobalSearchModalComponent],
  template: `
    <ui-global-search-modal
      [isOpen]="isOpen()"
      [loading]="isLoading()"
      [searchResults]="searchResults()"
      (close)="handleClose()"
      (searchQueryChanged)="handleSearchQueryChange($event)"
      (resultClicked)="handleResultClick($event)"
    />
  `,
})
export class GlobalSearchComponent {
  #router = inject(Router);
  #searchStore = injectSearchStore();
  #authService = inject(AuthService);

  // Inputs
  readonly isOpen = input<boolean>(false);

  // Outputs
  readonly close = output<void>();

  // Internal state
  readonly #searchQuery: WritableSignal<string> = signal<string>('');
  readonly #debouncedQuery: WritableSignal<string> = signal<string>('');

  // Query using store pattern (reactive with getter)
  readonly #omnisearchQuery = this.#searchStore.search(() => this.#debouncedQuery());

  // Computed
  readonly isLoading: Signal<boolean> = this.#omnisearchQuery.loading;
  readonly searchResults: Signal<SearchResultDto> = computed<SearchResultDto>(() => {
    return this.#omnisearchQuery.data() ?? {
      query: '',
      searchType: 'global',
      brands: [],
      cigars: [],
      clubs: [],
      users: [],
      total: 0,
      duration: 0,
    };
  });

  constructor() {
    // Debounce logic: update debouncedQuery 300ms after searchQuery changes
    let debounceTimeout: ReturnType<typeof setTimeout> | null = null;

    effect(() => {
      const query = this.#searchQuery();

      // Clear previous timeout
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }

      // Set new timeout (300ms debounce)
      debounceTimeout = setTimeout(() => {
        this.#debouncedQuery.set(query);
      }, 300);
    });

    // Reset search when user changes (login/logout)
    effect(() => {
      const currentUser = this.#authService.currentUser();

      // Reset search query (query will auto-refetch due to reactivity)
      this.#searchQuery.set('');
      this.#debouncedQuery.set('');
    });
  }

  /**
   * Handle search query change from modal
   */
  handleSearchQueryChange(query: string): void {
    this.#searchQuery.set(query);
  }

  /**
   * Handle result click
   * Navigate to Prestige URLs (slug/username)
   */
  handleResultClick(event: { id: string; type: 'brand' | 'cigar' | 'club' | 'user' }): void {
    const results = this.searchResults();

    switch (event.type) {
      case 'club': {
        const club = results.clubs?.find((c) => c.id === event.id);
        if (club?.slug) {
          void this.#router.navigate(['/club', club.slug]); // Clean URL: /club/slug
        }
        break;
      }
      case 'user': {
        const user = results.users?.find((u) => u.id === event.id);
        if (user?.username) {
          void this.#router.navigate(['/user', `@${user.username}`]); // Prestige URL: /user/@username
        }
        break;
      }
      case 'brand':
        // TODO: Implement brand page (/brand/slug)
        console.log('[GlobalSearch] Brand navigation not implemented:', event.id);
        break;
      case 'cigar': {
        const cigar = results.cigars?.find((c) => c.id === event.id);
        if (cigar?.slug) {
          void this.#router.navigate(['/cigar', cigar.slug]); // Prestige URL: /cigar/slug
        }
        break;
      }
    }
  }

  /**
   * Handle modal close
   */
  handleClose(): void {
    this.close.emit();
    // Reset search on close
    this.#searchQuery.set('');
    this.#debouncedQuery.set('');
  }
}
