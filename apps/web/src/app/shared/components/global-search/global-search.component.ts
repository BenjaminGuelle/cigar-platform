import { Component, input, output, signal, effect, inject, WritableSignal, Signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { injectQuery } from '../../../core/query';
import { GlobalSearchService, type ClubSearchResult } from '../../../core/services/global-search.service';
import { AuthService } from '../../../core/services/auth.service';
import {
  GlobalSearchModalComponent,
  type ClubSearchResultItem,
} from '@cigar-platform/shared/ui';

/**
 * Global Search Component (Smart Wrapper)
 *
 * Smart component that wraps GlobalSearchModal (dumb component)
 * Handles:
 * - Search query management with debouncing (300ms)
 * - Data fetching and caching (query layer)
 * - Data transformation
 * - Navigation logic
 *
 * Architecture:
 * - Controlled by parent (isOpen input)
 * - Uses custom injectQuery for caching/reactivity
 * - Debounced search with signals
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
      [clubResults]="clubResults()"
      (close)="handleClose()"
      (searchQueryChanged)="handleSearchQueryChange($event)"
      (resultClicked)="handleResultClick($event)"
    />
  `,
})
export class GlobalSearchComponent {
  #router = inject(Router);
  #searchService = inject(GlobalSearchService);
  #authService = inject(AuthService);

  // Inputs
  readonly isOpen = input<boolean>(false);

  // Outputs
  readonly close = output<void>();

  // Internal state
  readonly #searchQuery: WritableSignal<string> = signal<string>('');
  readonly #debouncedQuery: WritableSignal<string> = signal<string>('');

  // Query with manual refetch (no auto-caching per query, we refetch on demand)
  readonly #searchResults = injectQuery<ClubSearchResult[]>(() => ({
    queryKey: ['clubs', 'search'], // Fixed queryKey (not dependent on search term)
    queryFn: () => {
      const query = this.#debouncedQuery();
      if (!query || query.trim().length === 0) {
        return Promise.resolve([]);
      }
      return this.#searchService.searchClubs(query, 20);
    },
    enabled: false, // Disable auto-fetch, we'll trigger manually
  }));

  // Computed
  readonly isLoading: Signal<boolean> = this.#searchResults.loading;

  readonly clubResults: Signal<ClubSearchResultItem[]> = computed<ClubSearchResultItem[]>(() => {
    const clubs = this.#searchResults.data() ?? [];

    // Transform to display format
    return clubs.map((club) => ({
      id: club.id,
      name: club.name,
      description: club.description,
      visibility: club.visibility,
      memberCount: club.memberCount,
      avatarUrl: club.imageUrl ?? null,
      subtitle: this.formatSubtitle(club),
      iconBadge: club.visibility === 'PUBLIC' ? ('public' as const) : ('private' as const),
    }));
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

    // Trigger refetch when debounced query changes
    effect(() => {
      const query = this.#debouncedQuery();

      // Only fetch if query is not empty
      if (query && query.trim().length > 0) {
        // Reset query state before refetch to ensure clean state after cache clear
        this.#searchResults.invalidate();
        void this.#searchResults.refetch();
      } else {
        // Clear results if query is empty
        this.#searchResults.setData([]);
      }
    });

    // Reset search when user changes (login/logout)
    effect(() => {
      const currentUser = this.#authService.currentUser();

      // Invalidate and clear search results
      this.#searchResults.invalidate();
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
   */
  handleResultClick(event: { id: string; type: 'club' }): void {
    if (event.type === 'club') {
      // Navigate to club profile
      void this.#router.navigate(['/club', event.id]);
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

  /**
   * Format subtitle for display
   * Example: "24 membres · Public"
   */
  private formatSubtitle(club: ClubSearchResult): string {
    const memberText = club.memberCount === 1 ? 'membre' : 'membres';
    const visibilityText = club.visibility === 'PUBLIC' ? 'Public' : 'Privé';
    return `${club.memberCount} ${memberText} · ${visibilityText}`;
  }
}
