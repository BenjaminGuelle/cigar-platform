import { inject, signal, computed } from '@angular/core';
import { injectQuery } from '../query';
import type { Query } from '../query';
import { AnalyticsService as AnalyticsApiService } from '@cigar-platform/types/lib/analytics/analytics.service';
import type {
  PaginatedAnalyticsEventsDto,
  PlatformStatsDto,
  AnalyticsEventResponseDto,
} from '@cigar-platform/types';

const ITEMS_PER_PAGE = 50;

/**
 * Admin Analytics Store
 * Manages analytics events and platform stats with Query Layer
 */
export interface AdminAnalyticsStore {
  /**
   * Platform stats query (users, clubs, tastings, events counts)
   */
  stats: Query<PlatformStatsDto>;

  /**
   * All analytics events query (paginated)
   */
  events: Query<PaginatedAnalyticsEventsDto>;

  /**
   * Toggle event expansion
   */
  toggleExpand: (id: string) => void;

  /**
   * Check if event is expanded
   */
  isExpanded: (id: string) => boolean;

  /**
   * Get event by ID
   */
  getEvent: (id: string) => AnalyticsEventResponseDto | undefined;

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
 * Inject Admin Analytics Store
 * Factory function that creates analytics store with queries
 */
export function injectAdminAnalyticsStore(): AdminAnalyticsStore {
  const analyticsService = inject(AnalyticsApiService);

  // Local state for expanded events
  const expandedIds = signal<Set<string>>(new Set());

  // Pagination state
  const currentPage = signal(1);

  // Query: Platform Stats
  const stats = injectQuery<PlatformStatsDto>(() => ({
    queryKey: ['analytics', 'stats'],
    queryFn: () => analyticsService.analyticsControllerGetPlatformStats(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  }));

  // Query: All Analytics Events (paginated)
  const events = injectQuery<PaginatedAnalyticsEventsDto>(() => ({
    queryKey: ['analytics', 'events', 'list', currentPage()],
    queryFn: () =>
      analyticsService.analyticsControllerFindAll({
        limit: ITEMS_PER_PAGE,
        page: currentPage(),
        sortBy: 'createdAt',
        order: 'desc',
      }),
    staleTime: 60 * 1000, // 1 minute
  }));

  const toggleExpand = (id: string): void => {
    expandedIds.update((ids) => {
      const newSet = new Set(ids);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const isExpanded = (id: string): boolean => {
    return expandedIds().has(id);
  };

  const getEvent = (id: string): AnalyticsEventResponseDto | undefined => {
    return events.data()?.data.find((e) => e.id === id);
  };

  // Pagination computed values
  const totalPages = computed(() => {
    const meta = events.data()?.meta;
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
    stats,
    events,
    toggleExpand,
    isExpanded,
    getEvent,
    currentPage: () => currentPage(),
    totalPages: () => totalPages(),
    hasNextPage: () => hasNextPage(),
    hasPrevPage: () => hasPrevPage(),
    nextPage,
    prevPage,
    goToPage,
  };
}
