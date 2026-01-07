import { Injectable } from '@angular/core';
import type { QueryStoreBase } from '../base/query-store.base';

/**
 * Query Cache Entry
 * Holds a query instance and its reference count
 */
interface CacheEntry<T> {
  instance: QueryStoreBase<T>;
  refs: number;
}

/**
 * Query Cache Service
 * Global singleton that manages query instances and their cache
 *
 * Features:
 * - Shared queries between components (same queryKey = same instance)
 * - Reference counting for garbage collection
 * - Query invalidation by key
 *
 * @example
 * const cache = inject(QueryCacheService);
 * const query = cache.getOrCreate('user-123', () => new UserQuery());
 */
@Injectable({ providedIn: 'root' })
export class QueryCacheService {
  #cache = new Map<string, CacheEntry<any>>();

  /**
   * Get a query instance from cache (without incrementing refs)
   * Returns null if not found
   */
  get<T>(key: string): QueryStoreBase<T> | null {
    const entry = this.#cache.get(key);
    return entry ? (entry.instance as QueryStoreBase<T>) : null;
  }

  /**
   * Get or create a query instance
   * If query exists in cache, returns existing instance and increments ref count
   * Otherwise creates new instance
   */
  getOrCreate<T>(
    key: string,
    factory: () => QueryStoreBase<T>
  ): QueryStoreBase<T> {
    if (!this.#cache.has(key)) {
      this.#cache.set(key, {
        instance: factory(),
        refs: 0,
      });
    }

    const entry = this.#cache.get(key)!;
    entry.refs++;
    return entry.instance as QueryStoreBase<T>;
  }

  /**
   * Decrement reference count
   * When refs reach 0, query can be garbage collected
   */
  decrementRef(key: string): void {
    const entry = this.#cache.get(key);
    if (!entry) return;

    entry.refs--;

    // Optional: Garbage collect after timeout
    if (entry.refs === 0) {
      // Keep in cache for 30s in case it's needed again
      setTimeout(() => {
        const current = this.#cache.get(key);
        if (current && current.refs === 0) {
          this.#cache.delete(key);
        }
      }, 30_000);
    }
  }

  /**
   * Invalidate query by key
   * Marks the query as stale, forcing a refetch on next access
   */
  invalidateQuery(queryKey: unknown[]): void {
    const key = this.#serializeKey(queryKey);
    const entry = this.#cache.get(key);
    if (entry) {
      entry.instance.invalidate();
    }
  }

  /**
   * Invalidate all queries matching a partial key
   * Useful for invalidating all queries of a type
   *
   * @example
   * invalidateQueriesMatching(['clubs']) // Invalidates all club queries
   */
  invalidateQueriesMatching(partialKey: unknown[]): void {
    const prefix = this.#serializeKey(partialKey);

    for (const [key, entry] of this.#cache.entries()) {
      if (key.startsWith(prefix)) {
        entry.instance.invalidate();
      }
    }
  }

  /**
   * Refresh all active queries (TanStack Query pattern)
   *
   * This is the ALL STARS ⭐ pattern used by Google, Twitter, Gmail:
   * - Active queries (refs > 0): refetch in background (data stays visible)
   * - Inactive queries (refs = 0): just mark as stale (lazy refetch on next use)
   *
   * NEVER clears data - keeps UI responsive during refresh
   *
   * @returns Promise that resolves when all active refetches complete
   */
  async refreshActiveQueries(): Promise<void> {
    const refetchPromises: Promise<void>[] = [];

    for (const [, entry] of this.#cache.entries()) {
      if (entry.refs > 0) {
        // Active query: refetch in background (keeps current data visible)
        refetchPromises.push(
          entry.instance.refetchInBackground().catch(() => {
            // Silent fail - error is stored in query state
          })
        );
      } else {
        // Inactive query: just mark as stale (will refetch on next mount)
        entry.instance.invalidate();
      }
    }

    // Wait for all active refetches to complete
    await Promise.all(refetchPromises);
  }

  /**
   * Clear all queries (LOGOUT ONLY)
   *
   * ⚠️ DESTRUCTIVE: Only use on logout/session end
   * For pull-to-refresh, use refreshActiveQueries() instead
   *
   * Clears data and invalidates all cached queries
   */
  clear(): void {
    for (const [, entry] of this.#cache.entries()) {
      entry.instance.reset(); // Full reset (data = null, stale)
    }
  }

  /**
   * Get cache size (for debugging)
   */
  size(): number {
    return this.#cache.size;
  }

  /**
   * Find all queries matching a condition
   * Useful for bulk updates when ID/slug might differ
   *
   * @param keyPrefix - Partial key to match (e.g., ['clubs', 'detail'])
   * @param filter - Filter function to check data
   * @returns Array of matching query instances
   */
  findQueries<T>(keyPrefix: unknown[], filter?: (data: T | null) => boolean): any[] {
    const matches: any[] = [];

    for (const [key, entry] of this.#cache.entries()) {
      // Deserialize to compare arrays properly
      const parsedKey = JSON.parse(key) as unknown[];

      // Check if the key starts with the prefix
      const matchesPrefix = keyPrefix.every((val, idx) => parsedKey[idx] === val);

      if (matchesPrefix) {
        const data = entry.instance.data() as T | null;
        if (!filter || filter(data)) {
          matches.push(entry.instance);
        }
      }
    }

    return matches;
  }

  /**
   * Serialize query key to string
   * @private
   */
  #serializeKey(key: unknown[]): string {
    return JSON.stringify(key);
  }
}
