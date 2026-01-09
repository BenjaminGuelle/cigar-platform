import { inject, signal, computed } from '@angular/core';
import { injectQuery, injectMutation, QueryCacheService } from '../query';
import type { Query, Mutation } from '../query';
import { FeedbackService } from '@cigar-platform/types/lib/feedback/feedback.service';
import type {
  PaginatedFeedbackResponseDto,
  FeedbackResponseDto,
  UpdateFeedbackStatusDto,
} from '@cigar-platform/types';

const ITEMS_PER_PAGE = 20;

/**
 * Feedback Store (Admin)
 * Manages feedback data with Query Layer
 */
export interface FeedbackStore {
  /**
   * All feedbacks query (paginated)
   */
  feedbacks: Query<PaginatedFeedbackResponseDto>;

  /**
   * Update feedback status mutation
   */
  updateStatus: Mutation<FeedbackResponseDto, { id: string; data: UpdateFeedbackStatusDto }>;

  /**
   * Pagination controls
   */
  currentPage: () => number;
  totalPages: () => number;
  hasNextPage: () => boolean;
  hasPrevPage: () => boolean;
  nextPage: () => void;
  prevPage: () => void;
  goToPage: (page: number) => void;
}

/**
 * Inject Feedback Store
 * Factory function that creates feedback store with queries and mutations
 */
export function injectFeedbackStore(): FeedbackStore {
  const feedbackService = inject(FeedbackService);
  const queryCache = inject(QueryCacheService);

  // Pagination state
  const currentPage = signal(1);

  // Query: All Feedbacks (paginated)
  const feedbacks = injectQuery<PaginatedFeedbackResponseDto>(() => ({
    queryKey: ['feedbacks', 'list', currentPage()],
    queryFn: async () => {
      const response = await feedbackService.feedbackControllerFindAll({
        limit: ITEMS_PER_PAGE,
        page: currentPage(),
        sortBy: 'createdAt',
        order: 'desc',
      });
      return response;
    },
    staleTime: 1 * 60 * 1000, // 1 minute
  }));

  // Mutation: Update Feedback Status
  const updateStatus = injectMutation<FeedbackResponseDto, { id: string; data: UpdateFeedbackStatusDto }>({
    mutationFn: ({ id, data }: { id: string; data: UpdateFeedbackStatusDto }) =>
      feedbackService.feedbackControllerUpdateStatus(id, data),

    onSuccess: () => {
      // Invalidate all feedback queries (all pages)
      queryCache.invalidateQueriesMatching(['feedbacks', 'list']);
    },
  });

  // Pagination computed values
  const totalPages = computed(() => {
    const meta = feedbacks.data()?.meta;
    if (!meta) return 1;
    return Math.ceil(meta.total / ITEMS_PER_PAGE);
  });

  const hasNextPage = computed(() => currentPage() < totalPages());
  const hasPrevPage = computed(() => currentPage() > 1);

  const nextPage = (): void => {
    if (hasNextPage()) {
      currentPage.update((p) => p + 1);
    }
  };

  const prevPage = (): void => {
    if (hasPrevPage()) {
      currentPage.update((p) => p - 1);
    }
  };

  const goToPage = (page: number): void => {
    if (page >= 1 && page <= totalPages()) {
      currentPage.set(page);
    }
  };

  return {
    feedbacks,
    updateStatus,
    currentPage: () => currentPage(),
    totalPages: () => totalPages(),
    hasNextPage: () => hasNextPage(),
    hasPrevPage: () => hasPrevPage(),
    nextPage,
    prevPage,
    goToPage,
  };
}
