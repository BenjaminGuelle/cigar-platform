import {
  Component,
  signal,
  computed,
  inject,
  effect,
  WritableSignal,
  Signal,
  ChangeDetectionStrategy,
  ViewChild,
  ElementRef,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import type { SearchResultDto } from '@cigar-platform/types';
import {
  IconDirective,
  InputComponent,
  SearchResultGroupComponent,
  SearchResultItemComponent,
} from '@cigar-platform/shared/ui';
import { injectSearchStore } from '../../../core/stores/search.store';
import { AuthService } from '../../../core/services/auth.service';
import { CreateCigarModalComponent } from '../../../shared/components/create-cigar-modal/create-cigar-modal.component';

/**
 * Explore Page - Search Experience
 *
 * Full-page search interface (replacing the old modal pattern)
 *
 * Features:
 * - Omnisearch with prefix filtering (@username, #slug)
 * - Grouped results (brands, cigars, clubs, users)
 * - Keyboard navigation
 * - Smart caching (5 min stale time)
 * - Auto-focus on search input
 *
 * ALL STARS Architecture:
 * - Uses search.store (not service)
 * - Reactive with getter functions
 * - Query layer for caching
 * - Debounced search (300ms)
 */
@Component({
  selector: 'app-explore',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IconDirective,
    InputComponent,
    SearchResultGroupComponent,
    SearchResultItemComponent,
    CreateCigarModalComponent,
  ],
  templateUrl: './explore.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExplorePage implements AfterViewInit {
  @ViewChild('searchInput') searchInputRef!: ElementRef<HTMLInputElement>;

  readonly #router = inject(Router);
  readonly #searchStore = injectSearchStore();
  readonly #authService = inject(AuthService);

  // Search input control
  readonly searchControl = new FormControl('');

  // Internal state
  readonly #searchQuery: WritableSignal<string> = signal<string>('');
  readonly #debouncedQuery: WritableSignal<string> = signal<string>('');

  // Create cigar modal state
  readonly createCigarModalOpen = signal<boolean>(false);
  readonly createCigarPrefillName = signal<string>('');

  // Query using store pattern (reactive with getter)
  readonly #omnisearchQuery = this.#searchStore.search(() => this.#debouncedQuery());

  // Loading state
  readonly loading: Signal<boolean> = this.#omnisearchQuery.loading;

  // Search results
  readonly searchResults: Signal<SearchResultDto> = computed<SearchResultDto>(() => {
    const data = this.#omnisearchQuery.data();
    const currentQuery = this.#debouncedQuery();

    if (!data) {
      return {
        query: currentQuery,
        searchType: 'global',
        brands: [],
        cigars: [],
        clubs: [],
        users: [],
        total: 0,
        duration: 0,
      };
    }

    return {
      ...data,
      query: currentQuery,
    };
  });

  // Computed helpers for UI
  readonly hasResults = computed(() => {
    const results = this.searchResults();
    return (
      (results.cigars?.length ?? 0) > 0 ||
      (results.brands?.length ?? 0) > 0 ||
      (results.clubs?.length ?? 0) > 0 ||
      (results.users?.length ?? 0) > 0
    );
  });

  readonly showEmpty = computed(() => {
    const query = this.#debouncedQuery();
    return query.length > 0 && !this.loading() && !this.hasResults();
  });

  // Limited results (3 per group in global view)
  readonly limitedCigars = computed(() => (this.searchResults().cigars ?? []).slice(0, 3));
  readonly limitedBrands = computed(() => (this.searchResults().brands ?? []).slice(0, 3));
  readonly limitedClubs = computed(() => (this.searchResults().clubs ?? []).slice(0, 3));
  readonly limitedUsers = computed(() => (this.searchResults().users ?? []).slice(0, 3));

  readonly hasMoreCigars = computed(() => (this.searchResults().cigars?.length ?? 0) > 3);
  readonly hasMoreBrands = computed(() => (this.searchResults().brands?.length ?? 0) > 3);
  readonly hasMoreClubs = computed(() => (this.searchResults().clubs?.length ?? 0) > 3);
  readonly hasMoreUsers = computed(() => (this.searchResults().users?.length ?? 0) > 3);

  readonly hasExactCigarMatch = computed(() => {
    const query = this.#debouncedQuery().toLowerCase().trim();
    if (!query) return false;
    return (this.searchResults().cigars ?? []).some(
      (c) => c.name.toLowerCase() === query
    );
  });

  constructor() {
    // Debounce logic: update debouncedQuery 300ms after searchQuery changes
    let debounceTimeout: ReturnType<typeof setTimeout> | null = null;

    effect(() => {
      const query = this.#searchQuery();

      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }

      debounceTimeout = setTimeout(() => {
        this.#debouncedQuery.set(query);
      }, 300);
    });

    // Reset search when user changes (login/logout)
    effect(() => {
      this.#authService.currentUser();
      this.#searchQuery.set('');
      this.#debouncedQuery.set('');
    });

    // Sync FormControl with signal
    this.searchControl.valueChanges.subscribe((value) => {
      this.#searchQuery.set(value ?? '');
    });
  }

  ngAfterViewInit(): void {
    // Auto-focus search input on page load
    setTimeout(() => {
      this.searchInputRef?.nativeElement?.focus();
    }, 100);
  }

  /**
   * Handle result click - Navigate to entity page
   */
  handleResultClick(event: {
    id: string;
    type: 'brand' | 'cigar' | 'club' | 'user';
    name: string;
    subtitle?: string;
    avatarUrl?: string;
    iconBadge?: string;
  }): void {
    const results = this.searchResults();

    switch (event.type) {
      case 'club': {
        const club = results.clubs?.find((c) => c.id === event.id);
        if (club?.slug) {
          void this.#router.navigate(['/club', club.slug]);
        }
        break;
      }
      case 'user': {
        const user = results.users?.find((u) => u.id === event.id);
        if (user?.username) {
          void this.#router.navigate(['/user', `@${user.username}`]);
        }
        break;
      }
      case 'brand':
        // TODO: Implement brand page (/brand/slug)
        break;
      case 'cigar': {
        const cigar = results.cigars?.find((c) => c.id === event.id);
        if (cigar) {
          const identifier = cigar.slug ?? cigar.id;
          void this.#router.navigate(['/cigar', identifier]);
        }
        break;
      }
    }
  }

  /**
   * Handle create cigar request
   */
  handleCreateCigar(): void {
    const query = this.searchResults().query?.trim() ?? '';
    this.createCigarPrefillName.set(query);
    this.createCigarModalOpen.set(true);
  }

  /**
   * Handle "See All" for a specific entity type
   * TODO: Navigate to filtered results page or expand results
   */
  handleSeeAll(type: 'cigar' | 'brand' | 'club' | 'user'): void {
    // For now, we could expand the view or navigate to a filtered page
    // Implementation depends on product requirements
  }
}