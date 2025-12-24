import { computed, signal, Signal } from '@angular/core';
import type { QueryState } from '../types/query.types';

/**
 * Base Query Store
 * Abstract class that handles query state management with signals
 *
 * Features:
 * - Automatic stale time tracking
 * - Loading/error states
 * - Refetch & invalidate
 * - Optimistic updates
 *
 * @example
 * class UserQueryStore extends QueryStoreBase<User> {
 *   protected queryFn(): Promise<User> {
 *     return this.api.getUser();
 *   }
 * }
 */
export abstract class QueryStoreBase<T> {
  #state = signal<QueryState<T>>({
    data: null,
    loading: false,
    error: null,
    lastFetched: null,
    staleTime: 5 * 60 * 1000, // 5 minutes default
  });

  // Public selectors (computed signals)
  readonly data: Signal<T | null> = computed(() => this.#state().data);
  readonly loading: Signal<boolean> = computed(() => this.#state().loading);
  readonly error: Signal<Error | null> = computed(() => this.#state().error);
  readonly isStale: Signal<boolean> = computed(() => {
    const { lastFetched, staleTime } = this.#state();
    if (!lastFetched) return true;
    return Date.now() - lastFetched > staleTime;
  });

  /**
   * Abstract query function to be implemented by subclasses
   * This is where the actual API call happens
   */
  protected abstract queryFn(): Promise<T>;

  /**
   * Set stale time (how long data stays fresh)
   */
  setStaleTime(ms: number): void {
    this.#state.update((s) => ({ ...s, staleTime: ms }));
  }

  /**
   * Fetch data from server
   * @param force - Force fetch even if data is fresh
   */
  async fetch(force = false): Promise<void> {
    // Skip if data is fresh and not forced
    if (!force && !this.isStale()) {
      return;
    }

    this.#state.update((s) => ({ ...s, loading: true, error: null }));

    try {
      const data = await this.queryFn();
      this.#state.set({
        data,
        loading: false,
        error: null,
        lastFetched: Date.now(),
        staleTime: this.#state().staleTime,
      });
    } catch (error) {
      this.#state.update((s) => ({
        ...s,
        loading: false,
        error: error as Error,
      }));
      throw error; // Re-throw for error handling
    }
  }

  /**
   * Refetch data (force fresh fetch)
   */
  async refetch(): Promise<void> {
    return this.fetch(true);
  }

  /**
   * Invalidate query (mark as stale)
   * Next access will trigger a refetch
   */
  invalidate(): void {
    this.#state.update((s) => ({ ...s, lastFetched: null }));
  }

  /**
   * Set data manually (for optimistic updates)
   * Does NOT update lastFetched timestamp
   */
  setData(data: T): void {
    this.#state.update((s) => ({ ...s, data }));
  }

  /**
   * Set data and mark as fresh
   * Updates both data and lastFetched timestamp
   * Use this after successful mutations that return fresh data
   */
  setDataFresh(data: T): void {
    this.#state.update((s) => ({
      ...s,
      data,
      lastFetched: Date.now(),
      error: null,
    }));
  }

  /**
   * Reset query state
   */
  reset(): void {
    this.#state.set({
      data: null,
      loading: false,
      error: null,
      lastFetched: null,
      staleTime: this.#state().staleTime,
    });
  }

  /**
   * Serialize state (for persistence)
   */
  serialize(): { data: T | null; lastFetched: number | null } {
    const state = this.#state();
    return {
      data: state.data,
      lastFetched: state.lastFetched,
    };
  }

  /**
   * Hydrate state (from persistence)
   */
  hydrate(serialized: { data: T | null; lastFetched: number | null }): void {
    this.#state.update((s) => ({
      ...s,
      data: serialized.data,
      lastFetched: serialized.lastFetched,
    }));
  }
}
