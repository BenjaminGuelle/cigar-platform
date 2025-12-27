import { DestroyRef, effect, inject, signal, computed } from '@angular/core';
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
 * - Reactive queryKey switching (factory pattern)
 *
 * @example
 * ```typescript
 * // In Store:
 * const getClubById = (idGetter: () => string): Query<ClubResponseDto> => {
 *   return injectQuery(() => ({
 *     queryKey: ['clubs', 'detail', idGetter()],
 *     queryFn: () => clubsService.clubControllerFindOne(idGetter()),
 *     enabled: !!idGetter(),
 *     staleTime: 5 * 60 * 1000,
 *   }));
 * };
 *
 * // In Component:
 * @Component({...})
 * export class ClubComponent {
 *   clubId = signal<string>('');
 *   readonly clubQuery = this.#clubStore.getClubById(() => this.clubId());
 * }
 * ```
 */
export function injectQuery<T>(optionsFactory: () => QueryOptions<T>): Query<T> {
  const queryCache = inject(QueryCacheService);
  const destroyRef = inject(DestroyRef);

  // Track the current cache key
  const currentCacheKey = signal<string | null>(null);

  // Compute cache info from factory (reactive)
  const cacheInfo = computed(() => {
    const opts = optionsFactory();
    return {
      key: JSON.stringify(opts.queryKey),
      opts
    };
  });

  // Initialize store immediately (synchronous)
  const initialInfo = cacheInfo();
  currentCacheKey.set(initialInfo.key);
  const initialStore = queryCache.getOrCreate<T>(initialInfo.key, () => {
    const s = new DynamicQueryStore(initialInfo.opts.queryFn);
    if (initialInfo.opts.staleTime) {
      s.setStaleTime(initialInfo.opts.staleTime);
    }
    return s;
  });

  // Auto-fetch initial if enabled
  const initialEnabled = initialInfo.opts.enabled ?? true;
  const isInitialEnabled = typeof initialEnabled === 'boolean' ? initialEnabled : initialEnabled();
  if (isInitialEnabled) {
    initialStore.fetch().catch((error) => {
      console.error('[Query] Initial fetch failed:', error);
    });
  }

  // Watch for queryKey changes and switch cache stores
  effect(() => {
    const { key, opts } = cacheInfo();
    const oldKey = currentCacheKey();

    // If queryKey changed, cleanup old and setup new
    if (key !== oldKey) {
      // Decrement ref on old cache store
      if (oldKey) {
        queryCache.decrementRef(oldKey);
      }

      // Update current key
      currentCacheKey.set(key);

      // Get or create new cache store
      const store = queryCache.getOrCreate<T>(key, () => {
        const s = new DynamicQueryStore(opts.queryFn);
        if (opts.staleTime) {
          s.setStaleTime(opts.staleTime);
        }
        return s;
      });

      // Auto-fetch if enabled
      const enabled = opts.enabled ?? true;
      const isEnabled = typeof enabled === 'boolean' ? enabled : enabled();
      if (isEnabled) {
        store.fetch().catch((error) => {
          console.error('[Query] Fetch failed:', error);
        });
      }
    }
  });

  // Cleanup on component destroy
  destroyRef.onDestroy(() => {
    const key = currentCacheKey();
    if (key) {
      queryCache.decrementRef(key);
    }
  });

  // Helper to get current store
  const getStore = (): QueryStoreBase<T> => {
    const key = currentCacheKey();
    if (!key) {
      throw new Error('[Query] Not initialized');
    }
    const store = queryCache.get<T>(key);
    if (!store) {
      throw new Error(`[Query] Store not found for key: ${key}`);
    }
    return store;
  };

  // Return public query interface with computed wrappers
  return {
    data: computed(() => getStore().data()),
    loading: computed(() => getStore().loading()),
    error: computed(() => getStore().error()),
    isStale: computed(() => getStore().isStale()),
    refetch: () => getStore().refetch(),
    invalidate: () => getStore().invalidate(),
    setData: (data: T) => getStore().setData(data),
    setDataFresh: (data: T) => getStore().setDataFresh(data),
  };
}
