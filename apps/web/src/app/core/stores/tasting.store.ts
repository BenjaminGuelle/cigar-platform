import { inject, signal, computed } from '@angular/core';
import { injectQuery, injectMutation, QueryCacheService } from '../query';
import type { Query, Mutation } from '../query';
import { TastingsService } from '@cigar-platform/types/lib/tastings/tastings.service';
import type {
  TastingResponseDto,
  CreateTastingDto,
  UpdateTastingDto,
  CompleteTastingDto,
  PaginatedTastingResponseDto,
} from '@cigar-platform/types';
import { PwaService } from '../services/pwa.service';

const TASTINGS_PER_PAGE = 9;

/**
 * Paginated User Tastings Query
 * Returned by getTastingsByUser with pagination support
 */
export interface PaginatedUserTastingsQuery {
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
 * Tasting Store
 * Manages tasting data with Query Layer
 *
 * Features:
 * - Tasting details by ID
 * - User tastings (paginated, backend handles owner/public logic)
 * - CRUD mutations with cache invalidation
 * - Reactive getters for cigar/club tastings
 * - Auto-save pattern for DRAFT tastings
 *
 * @example
 * ```typescript
 * @Component({...})
 * export class TastingPageComponent {
 *   tastingStore = injectTastingStore();
 *
 *   tastingId = signal<string>('');
 *   // Pass a getter function for reactivity
 *   tasting = this.tastingStore.getTastingById(() => this.tastingId());
 *
 *   async updateTasting(data: UpdateTastingDto) {
 *     await this.tastingStore.updateTasting.mutate({ id: this.tastingId(), data });
 *   }
 * }
 * ```
 */
export interface TastingStore {
  /**
   * Get tasting by ID (reactive - pass a getter function)
   */
  getTastingById: (idGetter: () => string) => Query<TastingResponseDto>;

  /**
   * Get tastings by cigar ID (reactive - pass a getter function)
   */
  getTastingsByCigar: (cigarIdGetter: () => string) => Query<TastingResponseDto[]>;

  /**
   * Get tastings by club ID (reactive - pass a getter function)
   */
  getTastingsByClub: (clubIdGetter: () => string) => Query<TastingResponseDto[]>;

  /**
   * Get tastings for a user (reactive - pass a getter function)
   * Supports both UUID and username (with or without @ prefix)
   *
   * Returns paginated query with load more support.
   * Backend handles owner vs public logic:
   * - Owner: returns ALL tastings (including DRAFT)
   * - Non-owner with shareEvaluationsPublicly: returns PUBLIC + COMPLETED
   * - Non-owner without sharing: returns empty
   */
  getTastingsByUser: (userIdGetter: () => string) => PaginatedUserTastingsQuery;

  /**
   * Get current user's draft tastings (status = IN_PROGRESS)
   * Optionally filtered by cigarId
   */
  getDrafts: (cigarIdGetter?: () => string) => Query<TastingResponseDto[]>;

  /**
   * Create tasting mutation (DRAFT)
   */
  createTasting: Mutation<TastingResponseDto, CreateTastingDto>;

  /**
   * Update tasting mutation (auto-save, DRAFT only)
   */
  updateTasting: Mutation<TastingResponseDto, { id: string; data: UpdateTastingDto }>;

  /**
   * Complete tasting mutation (DRAFT → COMPLETED, immutable after)
   */
  completeTasting: Mutation<TastingResponseDto, { id: string; data: CompleteTastingDto }>;

  /**
   * Delete tasting mutation
   */
  deleteTasting: Mutation<void, string>;
}

/**
 * Inject Tasting Store
 * Factory function that creates tasting store with queries and mutations
 */
export function injectTastingStore(): TastingStore {
  const tastingsService = inject(TastingsService);
  const queryCache = inject(QueryCacheService);
  const pwaService = inject(PwaService);

  /**
   * Get tasting by ID (returns a reactive query)
   */
  const getTastingById = (idGetter: () => string): Query<TastingResponseDto> => {
    return injectQuery<TastingResponseDto>(() => ({
      queryKey: ['tastings', 'detail', idGetter()],
      queryFn: () => tastingsService.tastingControllerFindOne(idGetter()),
      enabled: !!idGetter(),
      staleTime: 5 * 60 * 1000, // 5 minutes (COMPLETED tastings are immutable)
    }));
  };

  /**
   * Get tastings by cigar ID (returns a reactive query)
   */
  const getTastingsByCigar = (cigarIdGetter: () => string): Query<TastingResponseDto[]> => {
    return injectQuery<TastingResponseDto[]>(() => ({
      queryKey: ['tastings', 'by-cigar', cigarIdGetter()],
      queryFn: async () => {
        const cigarId = cigarIdGetter();
        if (!cigarId) return [];
        const response = await tastingsService.tastingControllerFindByCigar(cigarId, {
          limit: 100,
          page: 1,
          sortBy: 'date',
          order: 'desc',
        });
        return response?.data ?? [];
      },
      enabled: !!cigarIdGetter(),
      staleTime: 5 * 60 * 1000, // 5 minutes
    }));
  };

  /**
   * Get tastings by club ID (returns a reactive query)
   */
  const getTastingsByClub = (clubIdGetter: () => string): Query<TastingResponseDto[]> => {
    return injectQuery<TastingResponseDto[]>(() => ({
      queryKey: ['tastings', 'by-club', clubIdGetter()],
      queryFn: async () => {
        const clubId = clubIdGetter();
        if (!clubId) return [];
        const response = await tastingsService.tastingControllerFindByClub(clubId, {
          limit: 100,
          page: 1,
          sortBy: 'date',
          order: 'desc',
        });
        return response?.data ?? [];
      },
      enabled: !!clubIdGetter(),
      staleTime: 2 * 60 * 1000, // 2 minutes
    }));
  };

  /**
   * Get tastings for a user (returns a paginated query with load more support)
   * Supports both UUID and username (with or without @ prefix)
   *
   * Backend handles owner vs public logic automatically.
   */
  const getTastingsByUser = (userIdGetter: () => string): PaginatedUserTastingsQuery => {
    // Pagination state for this specific user query
    const userCurrentPage = signal(1);
    const userAdditionalTastings = signal<TastingResponseDto[]>([]);
    const userLoadingMore = signal(false);

    // First page query
    const query = injectQuery<PaginatedTastingResponseDto>(() => ({
      queryKey: ['tastings', 'by-user', userIdGetter()],
      queryFn: async () => {
        const identifier = userIdGetter();
        if (!identifier) {
          return { data: [], meta: { total: 0, page: 1, limit: TASTINGS_PER_PAGE } };
        }
        // Reset pagination on refetch
        userAdditionalTastings.set([]);
        userCurrentPage.set(1);
        const response = await tastingsService.tastingControllerFindByUser(identifier, {
          limit: TASTINGS_PER_PAGE,
          page: 1,
          sortBy: 'date',
          order: 'desc',
        });
        return response;
      },
      enabled: !!userIdGetter(),
      staleTime: 2 * 60 * 1000, // 2 minutes
    }));

    // All tastings (first page + additional pages)
    const allTastings = computed(() => {
      const firstPage = query.data()?.data ?? [];
      return [...firstPage, ...userAdditionalTastings()];
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
      const identifier = userIdGetter();
      if (!identifier || userLoadingMore() || !hasMore()) return;

      userLoadingMore.set(true);
      try {
        const nextPage = userCurrentPage() + 1;
        const response = await tastingsService.tastingControllerFindByUser(identifier, {
          limit: TASTINGS_PER_PAGE,
          page: nextPage,
          sortBy: 'date',
          order: 'desc',
        });

        userAdditionalTastings.update((prev) => [...prev, ...(response.data ?? [])]);
        userCurrentPage.set(nextPage);
      } finally {
        userLoadingMore.set(false);
      }
    };

    return {
      query,
      allTastings: () => allTastings(),
      hasMore: () => hasMore(),
      loadMore,
      loadingMore: () => userLoadingMore(),
    };
  };

  /**
   * Get current user's draft tastings (status = IN_PROGRESS)
   * Optionally filtered by cigarId
   */
  const getDrafts = (cigarIdGetter?: () => string): Query<TastingResponseDto[]> => {
    return injectQuery<TastingResponseDto[]>(() => ({
      queryKey: ['tastings', 'drafts', cigarIdGetter?.() ?? 'all'],
      queryFn: async () => {
        const response = await tastingsService.tastingControllerFindMine({
          limit: 100,
          page: 1,
          status: 'DRAFT',
          cigarId: cigarIdGetter?.(),
          sortBy: 'date',
          order: 'desc',
        });
        return response?.data ?? [];
      },
      staleTime: 1 * 60 * 1000, // 1 minute (drafts change frequently)
    }));
  };

  // Mutation: Create Tasting (DRAFT)
  const createTasting = injectMutation<TastingResponseDto, CreateTastingDto>({
    mutationFn: (data: CreateTastingDto) => tastingsService.tastingControllerCreate(data),

    onSuccess: (newTasting: TastingResponseDto) => {
      // Invalidate user tastings (for profile page)
      queryCache.invalidateQueriesMatching(['tastings', 'by-user']);

      // Invalidate user public profile (stats change - evaluationCount)
      queryCache.invalidateQueriesMatching(['users', 'profile']);

      // Invalidate cigar tastings if applicable
      if (newTasting.cigarId) {
        queryCache.invalidateQueriesMatching(['tastings', 'by-cigar', newTasting.cigarId]);
      }
    },
  });

  // Mutation: Update Tasting (auto-save, DRAFT only)
  const updateTasting = injectMutation<TastingResponseDto, { id: string; data: UpdateTastingDto }>({
    mutationFn: ({ id, data }: { id: string; data: UpdateTastingDto }) =>
      tastingsService.tastingControllerUpdate(id, data),

    onSuccess: (updatedTasting: TastingResponseDto) => {
      // Invalidate specific tasting detail
      queryCache.invalidateQuery(['tastings', 'detail', updatedTasting.id]);

      // Invalidate user tastings (for profile page)
      queryCache.invalidateQueriesMatching(['tastings', 'by-user']);

      // Invalidate cigar/club tastings if applicable
      if (updatedTasting.cigarId) {
        queryCache.invalidateQueriesMatching(['tastings', 'by-cigar', updatedTasting.cigarId]);
      }
    },
  });

  // Mutation: Complete Tasting (DRAFT → COMPLETED, immutable after)
  const completeTasting = injectMutation<TastingResponseDto, { id: string; data: CompleteTastingDto }>({
    mutationFn: ({ id, data }: { id: string; data: CompleteTastingDto }) =>
      tastingsService.tastingControllerComplete(id, data),

    onSuccess: (completedTasting: TastingResponseDto) => {
      // Invalidate specific tasting detail
      queryCache.invalidateQuery(['tastings', 'detail', completedTasting.id]);

      // Invalidate user tastings (for profile page)
      queryCache.invalidateQueriesMatching(['tastings', 'by-user']);

      // Invalidate user public profile (stats change - evaluationCount)
      queryCache.invalidateQueriesMatching(['users', 'profile']);

      // Invalidate cigar tastings (completed tastings are public)
      if (completedTasting.cigarId) {
        queryCache.invalidateQueriesMatching(['tastings', 'by-cigar', completedTasting.cigarId]);
      }

      // Invalidate club profile-stats if tasting is shared with clubs
      const sharedClubs = (completedTasting as TastingResponseDto & { sharedClubs?: Array<{ club: { id: string } }> }).sharedClubs;
      if (sharedClubs && sharedClubs.length > 0) {
        for (const shared of sharedClubs) {
          queryCache.invalidateQuery(['clubs', 'profile-stats', shared.club.id]);
        }
      }

      // Mark tasting completed for PWA install prompt trigger
      pwaService.markTastingCompleted();
    },
  });

  // Mutation: Delete Tasting
  const deleteTasting = injectMutation<void, string>({
    mutationFn: (id: string) => tastingsService.tastingControllerRemove(id),

    onSuccess: (_result: void, tastingId: string) => {
      // Invalidate specific tasting detail
      queryCache.invalidateQuery(['tastings', 'detail', tastingId]);

      // Invalidate user tastings (for profile page)
      queryCache.invalidateQueriesMatching(['tastings', 'by-user']);

      // Invalidate user public profile (stats change - evaluationCount)
      queryCache.invalidateQueriesMatching(['users', 'profile']);

      // Invalidate all cigar tastings (we don't know which cigar this tasting belonged to)
      queryCache.invalidateQueriesMatching(['tastings', 'by-cigar']);

      // Invalidate all club tastings (we don't know which club this tasting belonged to)
      queryCache.invalidateQueriesMatching(['tastings', 'by-club']);

      // Invalidate club profile-stats
      queryCache.invalidateQueriesMatching(['clubs', 'profile-stats']);
    },
  });

  return {
    getTastingById,
    getTastingsByCigar,
    getTastingsByClub,
    getTastingsByUser,
    getDrafts,
    createTasting,
    updateTasting,
    completeTasting,
    deleteTasting,
  };
}
