import { Injectable, signal, computed } from '@angular/core';

/**
 * Explore Header Service
 *
 * Shared state between mobile-header-explore and explore.page
 * Allows the header (rendered in app-shell) to communicate with the page
 *
 * State:
 * - searchValue: Current search input value
 * - isFocused: Whether the search input is focused (search mode)
 */
@Injectable({
  providedIn: 'root',
})
export class ExploreHeaderService {
  // Search input value
  readonly #searchValue = signal<string>('');

  // Focus state (determines discovery vs search mode)
  readonly #isFocused = signal<boolean>(false);

  // Public readonly signals
  readonly searchValue = this.#searchValue.asReadonly();
  readonly isFocused = this.#isFocused.asReadonly();

  // Computed: is in search mode (focused)
  readonly isSearchMode = computed(() => this.#isFocused());
  readonly isDiscoveryMode = computed(() => !this.#isFocused());

  /**
   * Update search value
   */
  setSearchValue(value: string): void {
    this.#searchValue.set(value);
  }

  /**
   * Set focus state
   */
  setFocused(focused: boolean): void {
    this.#isFocused.set(focused);
  }

  /**
   * Cancel search - clear value and unfocus
   */
  cancel(): void {
    this.#searchValue.set('');
    this.#isFocused.set(false);
  }

  /**
   * Reset state (e.g., on route change or logout)
   */
  reset(): void {
    this.#searchValue.set('');
    this.#isFocused.set(false);
  }
}