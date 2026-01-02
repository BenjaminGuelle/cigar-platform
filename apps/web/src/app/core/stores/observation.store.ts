import { inject } from '@angular/core';
import { injectQuery, injectMutation, QueryCacheService } from '../query';
import type { Query, Mutation } from '../query';
import { ObservationsService } from '@cigar-platform/types/lib/observations/observations.service';
import type {
  ObservationResponseDto,
  UpsertObservationDto,
} from '@cigar-platform/types';

/**
 * Observation Store
 * Manages observation data with Query Layer
 *
 * Features:
 * - Observations by tasting ID (reactive getter)
 * - Upsert observation by phase (create or update)
 * - Delete observation by phase
 * - Cache invalidation for tasting queries
 *
 * @example
 * ```typescript
 * @Component({...})
 * export class TastingPageComponent {
 *   observationStore = injectObservationStore();
 *
 *   tastingId = signal<string>('');
 *   // Pass a getter function for reactivity
 *   observations = this.observationStore.getObservationsByTasting(() => this.tastingId());
 *
 *   async savePresentation(data: UpsertObservationDto) {
 *     await this.observationStore.upsertObservation.mutate({
 *       tastingId: this.tastingId(),
 *       phase: 'presentation',
 *       data
 *     });
 *   }
 * }
 * ```
 */
export interface ObservationStore {
  /**
   * Get observations by tasting ID (reactive - pass a getter function)
   */
  getObservationsByTasting: (tastingIdGetter: () => string) => Query<ObservationResponseDto[]>;

  /**
   * Upsert observation mutation (create or update for a specific phase)
   */
  upsertObservation: Mutation<
    ObservationResponseDto,
    { tastingId: string; phase: string; data: UpsertObservationDto }
  >;

  /**
   * Delete observation mutation (remove observation for a specific phase)
   */
  deleteObservation: Mutation<void, { tastingId: string; phase: string }>;
}

/**
 * Inject Observation Store
 * Factory function that creates observation store with queries and mutations
 */
export function injectObservationStore(): ObservationStore {
  const observationsService = inject(ObservationsService);
  const queryCache = inject(QueryCacheService);

  /**
   * Get observations by tasting ID (returns a reactive query)
   */
  const getObservationsByTasting = (
    tastingIdGetter: () => string
  ): Query<ObservationResponseDto[]> => {
    return injectQuery<ObservationResponseDto[]>(() => ({
      queryKey: ['observations', 'by-tasting', tastingIdGetter()],
      queryFn: async () => {
        const tastingId = tastingIdGetter();
        if (!tastingId) return [];
        const response = await observationsService.observationControllerFindAll(tastingId);
        return response ?? [];
      },
      enabled: !!tastingIdGetter(),
      staleTime: 2 * 60 * 1000, // 2 minutes (observations are frequently updated during tasting)
    }));
  };

  // Mutation: Upsert Observation (create or update for a specific phase)
  const upsertObservation = injectMutation<
    ObservationResponseDto,
    { tastingId: string; phase: string; data: UpsertObservationDto }
  >({
    mutationFn: ({ tastingId, phase, data }) =>
      observationsService.observationControllerUpsert(tastingId, phase, data),

    onSuccess: (observation: ObservationResponseDto) => {
      // Invalidate observations for this tasting
      queryCache.invalidateQueriesMatching(['observations', 'by-tasting', observation.tastingId]);

      // Invalidate tasting detail (to refresh completeness status)
      queryCache.invalidateQueriesMatching(['tastings', 'detail', observation.tastingId]);
    },
  });

  // Mutation: Delete Observation
  const deleteObservation = injectMutation<void, { tastingId: string; phase: string }>({
    mutationFn: ({ tastingId, phase }) =>
      observationsService.observationControllerRemove(tastingId, phase),

    onSuccess: (_result: void, { tastingId }) => {
      // Invalidate observations for this tasting
      queryCache.invalidateQueriesMatching(['observations', 'by-tasting', tastingId]);

      // Invalidate tasting detail
      queryCache.invalidateQueriesMatching(['tastings', 'detail', tastingId]);
    },
  });

  return {
    getObservationsByTasting,
    upsertObservation,
    deleteObservation,
  };
}