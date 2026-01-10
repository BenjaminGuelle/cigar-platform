import { inject, signal, computed } from '@angular/core';
import { injectQuery } from '../query';
import type { Query } from '../query';
import { DiscoverService } from '@cigar-platform/types/lib/discover/discover.service';
import type {
  DiscoverResponseDto,
  TastingResponseDto,
  PaginatedTastingResponseDto,
} from '@cigar-platform/types';

const TASTINGS_PER_PAGE = 9;

/**
 * Paginated Public Tastings Query
 * Returned by getPublicTastings with pagination support
 */
export interface PaginatedPublicTastingsQuery {
  /** First page query */
  query: Query<PaginatedTastingResponseDto>;
  /** All loaded tastings (accumulated across pages) */
  allTastings: () => TastingResponseDto[];
  /** Check if there are more tastings to load */
  hasMore: () => boolean;
  /** Load more tastings (next page) */
  loadMore: () => Promise<void>;
  /** Loading state for load more */
  loadingMore: () => boolean;
}

/**
 * Discover Store
 * Manages discovery content for explore page
 *
 * ALL STARS Architecture ⭐
 * - Uses Orval-generated DiscoverService
 * - Reactive with Query Layer
 * - Caching for optimal performance
 * - Type-safe with generated types
 *
 * Features:
 * - Recent cigars (3 newest)
 * - Public tastings with pagination (infinite scroll)
 * - Public endpoint (no auth required)
 *
 * @example
 * ```typescript
 * @Component({...})
 * export class ExploreDiscoveryComponent {
 *   discoverStore = injectDiscoverStore();
 *   tastingsQuery = this.discoverStore.getPublicTastings();
 *
 *   allTastings = this.tastingsQuery.allTastings;
 *   hasMore = this.tastingsQuery.hasMore;
 *   loadMore = () => this.tastingsQuery.loadMore();
 * }
 * ```
 */
export interface DiscoverStore {
  /**
   * Get discovery content (recent cigars only - legacy)
   */
  getDiscoveryContent: () => Query<DiscoverResponseDto>;

  /**
   * Get public tastings with pagination
   * Returns paginated query with infinite scroll support
   */
  getPublicTastings: () => PaginatedPublicTastingsQuery;
}

/**
 * Inject Discover Store
 * Factory function following ALL STARS store pattern
 */
export function injectDiscoverStore(): DiscoverStore {
  const discoverService = inject(DiscoverService);

  /**
   * Discovery content query with caching
   * Uses Orval-generated DiscoverService
   */
  const getDiscoveryContent = (): Query<DiscoverResponseDto> => {
    return injectQuery(() => ({
      queryKey: ['discover'],
      queryFn: async (): Promise<DiscoverResponseDto> => {
        return discoverService.discoverControllerGetDiscoveryContent();
      },
      staleTime: 1000 * 60 * 5, // 5 minutes cache
    }));
  };

  /**
   * Public tastings query with pagination (infinite scroll)
   * Returns all PUBLIC, COMPLETED tastings from all users
   */
  const getPublicTastings = (): PaginatedPublicTastingsQuery => {
    // Pagination state
    const currentPage = signal(1);
    const additionalTastings = signal<TastingResponseDto[]>([]);
    const loadingMore = signal(false);

    // First page query
    const query = injectQuery<PaginatedTastingResponseDto>(() => ({
      queryKey: ['discover', 'tastings'],
      queryFn: async (): Promise<PaginatedTastingResponseDto> => {
        // Reset pagination on refetch
        additionalTastings.set([]);
        currentPage.set(1);
        return discoverService.discoverControllerGetPublicTastings({
          limit: TASTINGS_PER_PAGE,
          page: 1,
        });
      },
      staleTime: 1000 * 60 * 2, // 2 minutes cache
    }));

    // All tastings (first page + additional pages)
    const allTastings = computed(() => {
      const firstPage = query.data()?.data ?? [];
      return [...firstPage, ...additionalTastings()];
    });

    // Check if there are more tastings to load
    const hasMore = computed(() => {
      const meta = query.data()?.meta;
      if (!meta) return false;
      const totalLoaded = allTastings().length;
      return totalLoaded < meta.total;
    });

    // Load more tastings
    const loadMore = async (): Promise<void> => {
      if (loadingMore() || !hasMore()) return;

      loadingMore.set(true);
      try {
        const nextPage = currentPage() + 1;
        const response = await discoverService.discoverControllerGetPublicTastings({
          limit: TASTINGS_PER_PAGE,
          page: nextPage,
        });

        additionalTastings.update((prev) => [...prev, ...(response.data ?? [])]);
        currentPage.set(nextPage);
      } finally {
        loadingMore.set(false);
      }
    };

    return {
      query,
      allTastings: () => allTastings(),
      hasMore: () => hasMore(),
      loadMore,
      loadingMore: () => loadingMore(),
    };
  };

  return {
    getDiscoveryContent,
    getPublicTastings,
  };
}