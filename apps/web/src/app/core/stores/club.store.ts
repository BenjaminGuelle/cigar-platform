import { inject } from '@angular/core';
import { injectQuery, injectMutation } from '../query';
import type { Query, Mutation } from '../query';
import { ClubsService } from '@cigar-platform/types/lib/clubs/clubs.service';
import type {
  ClubResponseDto,
  CreateClubDto,
  UpdateClubDto,
} from '@cigar-platform/types';

/**
 * Club Store
 * Manages club data with Query Layer
 *
 * Features:
 * - Public clubs search (for explore/discovery)
 * - Club details by ID
 * - CRUD mutations with optimistic updates
 * - Shared across all components
 *
 * @example
 * ```typescript
 * @Component({...})
 * export class ClubProfileComponent {
 *   clubStore = injectClubStore();
 *
 *   clubId = input.required<string>();
 *   club = this.clubStore.getClubById(this.clubId());
 *
 *   async updateClub(data: UpdateClubDto) {
 *     await this.clubStore.updateClub.mutate({ id: this.clubId(), data });
 *   }
 * }
 * ```
 */
export interface ClubStore {
  /**
   * Public clubs query (for explore/search)
   */
  publicClubs: Query<ClubResponseDto[]>;

  /**
   * Get club by ID
   */
  getClubById: (id: string) => Query<ClubResponseDto>;

  /**
   * Create club mutation
   */
  createClub: Mutation<ClubResponseDto, CreateClubDto>;

  /**
   * Update club mutation
   */
  updateClub: Mutation<ClubResponseDto, { id: string; data: UpdateClubDto }>;

  /**
   * Delete club mutation
   */
  deleteClub: Mutation<void, string>;
}

/**
 * Inject Club Store
 * Factory function that creates club store with queries and mutations
 */
export function injectClubStore(): ClubStore {
  const clubsService = inject(ClubsService);

  // Query: Public Clubs (for explore/discovery)
  const publicClubs = injectQuery<ClubResponseDto[]>({
    queryKey: ['clubs', 'public'],
    queryFn: async () => {
      const response: any = await clubsService.clubControllerFindAll({
        limit: 100,
        page: 1,
      });
      return response?.data ?? [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  /**
   * Get club by ID (returns a new query)
   */
  const getClubById = (id: string): Query<ClubResponseDto> => {
    return injectQuery<ClubResponseDto>({
      queryKey: ['clubs', 'detail', id],
      queryFn: () => clubsService.clubControllerFindOne(id),
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };

  // Mutation: Create Club
  const createClub = injectMutation<ClubResponseDto, CreateClubDto>({
    mutationFn: (data: CreateClubDto) => clubsService.clubControllerCreate(data),

    onSuccess: (newClub: ClubResponseDto) => {
      // Invalidate public clubs to include new club
      publicClubs.invalidate();
      console.log('[ClubStore] Club created:', newClub.id);
    },

    onError: (error: Error) => {
      console.error('[ClubStore] Create club failed:', error);
    },
  });

  // Mutation: Update Club
  const updateClub = injectMutation<ClubResponseDto, { id: string; data: UpdateClubDto }>({
    mutationFn: ({ id, data }) => clubsService.clubControllerUpdate(id, data),

    onSuccess: (updatedClub: ClubResponseDto, variables) => {
      // Invalidate specific club query
      const clubQuery = getClubById(variables.id);
      clubQuery.invalidate();

      // Invalidate public clubs list
      publicClubs.invalidate();

      console.log('[ClubStore] Club updated:', updatedClub.id);
    },

    onError: (error: Error) => {
      console.error('[ClubStore] Update club failed:', error);
    },
  });

  // Mutation: Delete Club
  const deleteClub = injectMutation<void, string>({
    mutationFn: (id: string) => clubsService.clubControllerRemove(id),

    onSuccess: (_, clubId) => {
      // Invalidate public clubs
      publicClubs.invalidate();

      console.log('[ClubStore] Club deleted:', clubId);
    },

    onError: (error: Error) => {
      console.error('[ClubStore] Delete club failed:', error);
    },
  });

  return {
    publicClubs,
    getClubById,
    createClub,
    updateClub,
    deleteClub,
  };
}
