import { Injectable, inject } from '@angular/core';
import { SearchService } from '@cigar-platform/types/lib/search/search.service';
import type { SearchResultDto } from '@cigar-platform/types';

/**
 * Global Search Service
 *
 * Stateless service for omnisearch operations
 * Uses backend /api/search endpoint with prefix-based filtering
 *
 * Features:
 * - Promise-based (query layer compatible)
 * - Server-side search (brands, cigars, clubs, users)
 * - Prefix filtering (@username, #slug)
 * - Performance optimized (<100ms backend target)
 * - Type-safe
 *
 * Architecture:
 * - No state, pure functions
 * - Returns Promises for injectQuery
 * - Debouncing handled by component
 *
 * Search Prefixes:
 * - @username → Search users only
 * - #slug → Search clubs only
 * - No prefix → Global search (brands, cigars, PUBLIC clubs, users)
 */
@Injectable({
  providedIn: 'root',
})
export class GlobalSearchService {
  #searchService = inject(SearchService);

  /**
   * Universal search using backend /api/search endpoint
   *
   * Supports prefix-based filtering:
   * - @username → Search users only
   * - #slug → Search clubs only
   * - No prefix → Global search (brands, cigars, PUBLIC clubs, users)
   *
   * @param query - Search query string (with optional prefix)
   * @returns Promise of search results
   */
  async search(query: string): Promise<SearchResultDto> {
    // Empty query returns empty results
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

    try {
      // Call backend omnisearch endpoint
      const result = await this.#searchService.searchControllerSearch({ q: query });
      return result;
    } catch (error) {
      // Error handling - return empty results
      console.error('[GlobalSearchService] Search failed:', error);
      return {
        query,
        searchType: 'global',
        brands: [],
        cigars: [],
        clubs: [],
        users: [],
        total: 0,
        duration: 0,
      };
    }
  }
}
