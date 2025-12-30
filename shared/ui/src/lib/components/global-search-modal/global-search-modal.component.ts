import {
  Component,
  input,
  output,
  signal,
  computed,
  effect,
  inject,
  HostListener,
  WritableSignal,
  Signal,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IconDirective } from '../../directives/icon';
import { SearchResultGroupComponent } from '../search-result-group';
import { SearchResultItemComponent, type SearchResultIconBadge } from '../search-result-item';
import { ModalComponent } from '../modal';
import type { SearchResultDto } from '@cigar-platform/types';
import clsx from 'clsx';

/**
 * Unified Search Result Item for UI
 * Flattened list for keyboard navigation
 */
export interface SearchResultItem {
  id: string;
  type: 'brand' | 'cigar' | 'club' | 'user';
  name: string;
  subtitle: string;
  avatarUrl: string | null | undefined;
  iconBadge?: SearchResultIconBadge;
}

/**
 * Global Search Modal Component
 *
 * Intelligent omnisearch modal accessible from anywhere in the app
 * Command Palette / Spotlight inspired
 *
 * Features:
 * - Single search input (debounced)
 * - Grouped results by entity type (brands, cigars, clubs, users)
 * - Keyboard navigation (↑↓ Enter Esc)
 * - Prefix-based filtering (@username, #slug)
 * - Non-destructive (preserves context)
 * - Popover style on desktop (from search icon)
 * - Full-screen on mobile
 *
 * Design Philosophy:
 * - Usage-first, not browsing-first
 * - Intentional discovery
 * - Minimal, focused interface
 * - Consistent with app modal system
 *
 * Architecture:
 * - Uses shared ModalComponent (position: right)
 * - Receives search results from parent (SearchResultDto)
 * - Emits navigation events
 * - Stateless (controlled component)
 */

@Component({
  selector: 'ui-global-search-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IconDirective,
    SearchResultGroupComponent,
    SearchResultItemComponent,
    ModalComponent,
  ],
  templateUrl: './global-search-modal.component.html',
})
export class GlobalSearchModalComponent {
  #router = inject(Router);

  @ViewChild('searchInput') searchInputRef?: ElementRef<HTMLInputElement>;

  // Inputs
  readonly isOpen = input<boolean>(false);
  readonly loading = input<boolean>(false);
  readonly searchResults = input<SearchResultDto>({
    query: '',
    searchType: 'global',
    brands: [],
    cigars: [],
    clubs: [],
    users: [],
    total: 0,
    duration: 0,
  });

  // Outputs
  readonly close = output<void>();
  readonly searchQueryChanged = output<string>();
  readonly resultClicked = output<{ id: string; type: 'brand' | 'cigar' | 'club' | 'user' }>();

  // Internal State
  readonly searchControl = new FormControl('');
  readonly #activeResultIndex: WritableSignal<number> = signal<number>(-1);

  // Computed - Flatten all results for keyboard navigation
  readonly allResults: Signal<SearchResultItem[]> = computed<SearchResultItem[]>(() => {
    const results = this.searchResults();
    const items: SearchResultItem[] = [];

    // Add brands
    (results.brands ?? []).forEach((brand) => {
      items.push({
        id: brand.id,
        type: 'brand',
        name: brand.name,
        subtitle: brand.metadata ?? brand.country,
        avatarUrl: brand.imageUrl,
      });
    });

    // Add cigars
    (results.cigars ?? []).forEach((cigar) => {
      items.push({
        id: cigar.id,
        type: 'cigar',
        name: cigar.name,
        subtitle: cigar.metadata ?? '',
        avatarUrl: cigar.imageUrl,
      });
    });

    // Add clubs
    (results.clubs ?? []).forEach((club) => {
      items.push({
        id: club.id,
        type: 'club',
        name: club.name,
        subtitle: club.metadata ?? '',
        avatarUrl: club.imageUrl,
        iconBadge: club.visibility === 'PUBLIC' ? ('public' as const) : ('private' as const),
      });
    });

    // Add users
    (results.users ?? []).forEach((user) => {
      items.push({
        id: user.id,
        type: 'user',
        name: user.name,
        subtitle: `@${user.username}`,
        avatarUrl: user.imageUrl,
      });
    });

    return items;
  });

  readonly hasResults: Signal<boolean> = computed<boolean>(() => {
    return this.allResults().length > 0;
  });

  readonly showEmpty: Signal<boolean> = computed<boolean>(() => {
    const query = this.searchControl.value?.trim() || '';
    return query.length > 0 && !this.loading() && !this.hasResults();
  });

  readonly hasExactCigarMatch: Signal<boolean> = computed<boolean>(() => {
    const results = this.searchResults();
    const query = results.query.toLowerCase().trim();
    return (results.cigars ?? []).some(cigar =>
      cigar.name.toLowerCase() === query
    );
  });

  // Computed - Limited results for global view (3 max per section)
  readonly limitedBrands = computed(() => {
    const results = this.searchResults();
    const isGlobal = results.searchType === 'global';
    const brands = results.brands ?? [];
    return isGlobal ? brands.slice(0, 3) : brands;
  });

  readonly hasMoreBrands = computed(() => {
    const results = this.searchResults();
    const isGlobal = results.searchType === 'global';
    return isGlobal && (results.brands ?? []).length > 3;
  });

  readonly limitedCigars = computed(() => {
    const results = this.searchResults();
    const isGlobal = results.searchType === 'global';
    const cigars = results.cigars ?? [];
    return isGlobal ? cigars.slice(0, 3) : cigars;
  });

  readonly hasMoreCigars = computed(() => {
    const results = this.searchResults();
    const isGlobal = results.searchType === 'global';
    return isGlobal && (results.cigars ?? []).length > 3;
  });

  readonly limitedClubs = computed(() => {
    const results = this.searchResults();
    const isGlobal = results.searchType === 'global';
    const clubs = results.clubs ?? [];
    return isGlobal ? clubs.slice(0, 3) : clubs;
  });

  readonly hasMoreClubs = computed(() => {
    const results = this.searchResults();
    const isGlobal = results.searchType === 'global';
    return isGlobal && (results.clubs ?? []).length > 3;
  });

  readonly limitedUsers = computed(() => {
    const results = this.searchResults();
    const isGlobal = results.searchType === 'global';
    const users = results.users ?? [];
    return isGlobal ? users.slice(0, 3) : users;
  });

  readonly hasMoreUsers = computed(() => {
    const results = this.searchResults();
    const isGlobal = results.searchType === 'global';
    return isGlobal && (results.users ?? []).length > 3;
  });

  constructor() {
    // Focus input when modal opens
    effect(() => {
      if (this.isOpen()) {
        // Use setTimeout to ensure DOM is ready
        setTimeout(() => {
          this.searchInputRef?.nativeElement.focus();
        }, 100);
      } else {
        // Reset when closed
        this.searchControl.setValue('');
        this.#activeResultIndex.set(-1);
      }
    });

    // Emit search query changes - Use valueChanges observable, not effect!
    this.searchControl.valueChanges.subscribe((query) => {
      this.searchQueryChanged.emit(query || '');
    });

    // Reset active index when results change
    effect(() => {
      const results = this.allResults();
      if (results.length > 0) {
        this.#activeResultIndex.set(0);
      } else {
        this.#activeResultIndex.set(-1);
      }
    });
  }

  /**
   * Handle keyboard navigation
   */
  @HostListener('document:keydown', ['$event'])
  handleKeyboard(event: KeyboardEvent): void {
    if (!this.isOpen()) return;

    const results = this.allResults();
    const currentIndex = this.#activeResultIndex();

    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        this.handleClose();
        break;

      case 'ArrowDown':
        event.preventDefault();
        if (results.length > 0) {
          const nextIndex = currentIndex < results.length - 1 ? currentIndex + 1 : 0;
          this.#activeResultIndex.set(nextIndex);
        }
        break;

      case 'ArrowUp':
        event.preventDefault();
        if (results.length > 0) {
          const prevIndex = currentIndex > 0 ? currentIndex - 1 : results.length - 1;
          this.#activeResultIndex.set(prevIndex);
        }
        break;

      case 'Enter':
        event.preventDefault();
        if (currentIndex >= 0 && currentIndex < results.length) {
          const result = results[currentIndex];
          this.handleResultClick(result);
        }
        break;
    }
  }

  /**
   * Handle close
   */
  handleClose(): void {
    this.close.emit();
  }

  /**
   * Handle result click
   */
  handleResultClick(result: SearchResultItem): void {
    this.resultClicked.emit({ id: result.id, type: result.type });
    this.handleClose();
  }

  /**
   * Handle create cigar action
   * Triggered when user clicks the "Add to database" virtual item
   */
  handleCreateCigar(): void {
    const query = this.searchResults().query;
    // TODO: Emit event to parent to open create cigar modal with pre-filled name
    console.log('[GlobalSearchModal] Create cigar requested:', query);
    this.handleClose();
  }

  /**
   * Handle "See all" click - filters search to specific category
   * Simulates prefix by updating search query
   */
  handleSeeAll(type: 'brand' | 'cigar' | 'club' | 'user'): void {
    const currentQuery = this.searchResults().query;
    const prefix = type === 'user' ? '@' : type === 'club' ? '#' : '';

    // Update search control to trigger new search with prefix
    // For brands/cigars, no prefix exists, so just keep the query as-is
    // The backend will filter by searchType
    if (prefix) {
      this.searchControl.setValue(prefix + currentQuery);
    }
  }

  /**
   * Check if result is active (keyboard navigation)
   * Maps flattened index to actual group position
   */
  isResultActive(type: string, localIndex: number): boolean {
    const results = this.allResults();
    const globalIndex = this.#activeResultIndex();

    // Find the result at the global active index
    const activeResult = results[globalIndex];
    if (!activeResult) return false;

    // Check if this result type and local index matches the active one
    const sameTypeResults = results.filter(r => r.type === type);
    return activeResult.type === type && sameTypeResults[localIndex]?.id === activeResult.id;
  }
}
