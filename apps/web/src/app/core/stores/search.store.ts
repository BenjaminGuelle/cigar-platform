import { inject } from '@angular/core';
import { injectQuery } from '../query';
import type { Query } from '../query';
import { SearchService } from '@cigar-platform/types/lib/search/search.service';
import type { SearchResultDto } from '@cigar-platform/types';

/**
 * Search Store
 * Manages omnisearch with Query Layer
 *
 * ALL STARS Architecture ⭐
 * - Uses Orval-generated SearchService (no HttpClient)
 * - Reactive with getter functions
 * - Query layer for caching/reactivity
 * - Type-safe with generated types
 *
 * Features:
 * - Prefix-based search (@users, #clubs, global)
 * - Visibility filtering (handled by backend)
 * - Performance optimized (<100ms backend target)
 * - Cached results (5 min stale time)
 *
 * @example
 * ```typescript
 * @Component({...})
 * export class SearchComponent {
 *   searchStore = injectSearchStore();
 *   searchQuery = signal<string>('');
 *
 *   results = this.searchStore.search(() => this.searchQuery());
 * }
 * ```
 */
export interface SearchStore {
  /**
   * Search query (reactive - pass a getter function)
   * Supports prefix filtering: @username, #slug
   */
  search: (queryGetter: () => string) => Query<SearchResultDto>;
}

/**
 * Inject Search Store
 * Factory function following ALL STARS store pattern
 */
export function injectSearchStore(): SearchStore {
  const searchService = inject(SearchService);

  /**
   * Search query with caching
   * Uses Orval-generated SearchService
   */
  const search = (queryGetter: () => string): Query<SearchResultDto> => {
    return injectQuery(() => {
      const query = queryGetter();
      return {
        queryKey: ['search', query],
        queryFn: async (): Promise<SearchResultDto> => {
          // Return empty result if query is empty
          if (!query || query.trim().length === 0) {
            return {
              query: '',
              searchType: 'global',
              brands: [],
              cigars: [],
              clubs: [],
              users: [],
              total: 0,
              duration: 0,
            };
          }

          // Use Orval-generated service
          return searchService.searchControllerSearch({ q: query });
        },
        enabled: !!query && query.trim().length >= 1,
        staleTime: 1000 * 60 * 2, // 2 minutes (optimized for freshness)
      };
    });
  };

  return {
    search,
  };
}
