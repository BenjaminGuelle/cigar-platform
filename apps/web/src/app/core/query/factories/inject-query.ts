import { DestroyRef, effect, inject, signal } from '@angular/core';
import { QueryCacheService } from '../services/query-cache.service';
import { QueryStoreBase } from '../base/query-store.base';
import type { Query, QueryOptions } from '../types/query.types';

/**
 * Dynamic Query Store
 * Internal implementation that wraps queryFn in a QueryStoreBase
 */
class DynamicQueryStore<T> extends QueryStoreBase<T> {
  constructor(private _queryFn: () => Promise<T>) {
    super();
  }

  protected queryFn(): Promise<T> {
    return this._queryFn();
  }
}

/**
 * Inject Query
 * Factory function that creates a query with automatic caching and lifecycle management
 *
 * Features:
 * - Automatic cache sharing (same queryKey = same data)
 * - Auto-fetch on component init
 * - Auto-cleanup on component destroy
 * - Conditional fetching with enabled signal
 *
 * @example
 * ```typescript
 * @Component({...})
 * export class UserComponent {
 *   userId = input.required<string>();
 *
 *   user = injectQuery({
 *     queryKey: ['user', this.userId()],
 *     queryFn: () => this.api.getUser(this.userId()),
 *     staleTime: 5 * 60 * 1000, // 5 minutes
 *   });
 * }
 *
 * // Template
 * @if (user.loading()) {
 *   <spinner />
 * } @else if (user.data(); as userData) {
 *   <h1>{{ userData.name }}</h1>
 * }
 * ```
 */
export function injectQuery<T>(options: QueryOptions<T>): Query<T> {
  const queryCache = inject(QueryCacheService);
  const destroyRef = inject(DestroyRef);

  // Serialize query key for cache lookup
  const cacheKey = JSON.stringify(options.queryKey);

  // Get or create query from cache
  const queryStore = queryCache.getOrCreate<T>(
    cacheKey,
    () => {
      const store = new DynamicQueryStore(options.queryFn);
      if (options.staleTime) {
        store.setStaleTime(options.staleTime);
      }
      return store;
    }
  );

  // Enabled signal (default: true)
  const enabled = options.enabled ?? signal(true);

  // Auto-fetch when enabled
  effect(
    () => {
      if (enabled()) {
        queryStore.fetch().catch((error) => {
          // Error is already in query.error signal
          console.error('[Query] Fetch failed:', error);
        });
      }
    }
  );

  // Cleanup on component destroy
  destroyRef.onDestroy(() => {
    queryCache.decrementRef(cacheKey);
  });

  // Return public query interface
  return {
    data: queryStore.data,
    loading: queryStore.loading,
    error: queryStore.error,
    isStale: queryStore.isStale,
    refetch: () => queryStore.refetch(),
    invalidate: () => queryStore.invalidate(),
    setData: (data: T) => queryStore.setData(data),
    setDataFresh: (data: T) => queryStore.setDataFresh(data),
  };
}
