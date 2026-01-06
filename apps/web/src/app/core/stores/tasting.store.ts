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

const TASTINGS_PER_PAGE = 20;

/**
 * Tasting Store
 * Manages tasting data with Query Layer
 *
 * Features:
 * - My tastings (paginated)
 * - Tasting details by ID
 * - CRUD mutations with optimistic updates
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
   * My tastings query (paginated with load more)
   */
  myTastings: Query<PaginatedTastingResponseDto>;

  /**
   * All loaded tastings (accumulated across pages)
   */
  allMyTastings: () => TastingResponseDto[];

  /**
   * Check if there are more tastings to load
   */
  hasMoreTastings: () => boolean;

  /**
   * Load more tastings (next page)
   */
  loadMoreTastings: () => Promise<void>;

  /**
   * Loading state for load more
   */
  loadingMore: () => boolean;

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

  // Load more state
  const currentPage = signal(1);
  const additionalTastings = signal<TastingResponseDto[]>([]);
  const loadingMore = signal(false);

  // Query: My Tastings (first page)
  const myTastings = injectQuery<PaginatedTastingResponseDto>(() => ({
    queryKey: ['tastings', 'me'],
    queryFn: async () => {
      // Reset additional tastings when first page is refetched
      additionalTastings.set([]);
      currentPage.set(1);
      const response = await tastingsService.tastingControllerFindMine({
        limit: TASTINGS_PER_PAGE,
        page: 1,
        sortBy: 'date',
        order: 'desc',
      });
      return response;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  }));

  // All tastings (first page + additional pages)
  const allMyTastings = computed(() => {
    const firstPage = myTastings.data()?.data ?? [];
    return [...firstPage, ...additionalTastings()];
  });

  // Check if there are more tastings to load
  const hasMoreTastings = computed(() => {
    const meta = myTastings.data()?.meta;
    if (!meta) return false;
    const totalLoaded = allMyTastings().length;
    return totalLoaded < meta.total;
  });

  // Load more tastings
  const loadMoreTastings = async (): Promise<void> => {
    if (loadingMore() || !hasMoreTastings()) return;

    loadingMore.set(true);
    try {
      const nextPage = currentPage() + 1;
      const response = await tastingsService.tastingControllerFindMine({
        limit: TASTINGS_PER_PAGE,
        page: nextPage,
        sortBy: 'date',
        order: 'desc',
      });

      additionalTastings.update((prev) => [...prev, ...(response.data ?? [])]);
      currentPage.set(nextPage);
    } finally {
      loadingMore.set(false);
    }
  };

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
      // Invalidate my tastings to include new tasting
      myTastings.invalidate();

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

      // Invalidate my tastings
      myTastings.invalidate();

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

      // Invalidate my tastings
      myTastings.invalidate();

      // Invalidate cigar tastings (completed tastings are public)
      if (completedTasting.cigarId) {
        queryCache.invalidateQueriesMatching(['tastings', 'by-cigar', completedTasting.cigarId]);
      }

      // Invalidate user profile-stats (new completed tasting affects stats & journal)
      queryCache.invalidateQuery(['users', 'profile-stats', 'me']);

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
      // Invalidate my tastings
      myTastings.invalidate();

      // Invalidate specific tasting detail
      queryCache.invalidateQuery(['tastings', 'detail', tastingId]);

      // Invalidate all cigar tastings (we don't know which cigar this tasting belonged to)
      queryCache.invalidateQueriesMatching(['tastings', 'by-cigar']);

      // Invalidate all club tastings (we don't know which club this tasting belonged to)
      queryCache.invalidateQueriesMatching(['tastings', 'by-club']);

      // Invalidate profile-stats (deleted tasting may affect stats & journal)
      queryCache.invalidateQuery(['users', 'profile-stats', 'me']);
      queryCache.invalidateQueriesMatching(['clubs', 'profile-stats']);
    },
  });

  return {
    myTastings,
    allMyTastings: () => allMyTastings(),
    hasMoreTastings: () => hasMoreTastings(),
    loadMoreTastings,
    loadingMore: () => loadingMore(),
    getTastingById,
    getTastingsByCigar,
    getTastingsByClub,
    getDrafts,
    createTasting,
    updateTasting,
    completeTasting,
    deleteTasting,
  };
}
