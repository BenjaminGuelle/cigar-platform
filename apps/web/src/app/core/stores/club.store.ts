import { inject } from '@angular/core';
import { injectQuery, injectMutation, QueryCacheService } from '../query';
import type { Query, Mutation } from '../query';
import { ClubsService } from '@cigar-platform/types/lib/clubs/clubs.service';
import type {
  ClubResponseDto,
  CreateClubDto,
  UpdateClubDto,
  CreateJoinRequestDto,
  JoinByCodeDto,
  UpdateJoinRequestDto,
  ClubMemberResponseDto,
  ClubJoinRequestResponseDto,
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
 *   clubId = signal<string>('');
 *   // Pass a getter function for reactivity
 *   club = this.clubStore.getClubById(() => this.clubId());
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
   * Get club by ID (reactive - pass a getter function)
   */
  getClubById: (idGetter: () => string) => Query<ClubResponseDto>;

  /**
   * Get club members by club ID (reactive - pass a getter function)
   */
  getClubMembers: (clubIdGetter: () => string) => Query<ClubMemberResponseDto[]>;

  /**
   * Get join requests by club ID (reactive - pass getter functions)
   * @param clubIdGetter - Getter for club ID
   * @param canManageGetter - Getter for permission check (optional, defaults to true)
   */
  getJoinRequests: (clubIdGetter: () => string, canManageGetter?: () => boolean) => Query<ClubJoinRequestResponseDto[]>;

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

  /**
   * Join club mutation (creates join request, auto-joins if public + auto-approve)
   */
  joinClub: Mutation<void, { clubId: string; data?: CreateJoinRequestDto }>;

  /**
   * Join club by invite code mutation
   */
  joinByCode: Mutation<void, JoinByCodeDto>;

  /**
   * Cancel join request mutation
   */
  cancelJoinRequest: Mutation<void, { clubId: string; requestId: string }>;

  /**
   * Update join request mutation (admin: approve/reject)
   */
  updateJoinRequest: Mutation<void, { clubId: string; requestId: string; data: UpdateJoinRequestDto }>;
}

/**
 * Inject Club Store
 * Factory function that creates club store with queries and mutations
 */
export function injectClubStore(): ClubStore {
  const clubsService = inject(ClubsService);
  const queryCache = inject(QueryCacheService);

  // Query: Public Clubs (for explore/discovery)
  const publicClubs = injectQuery<ClubResponseDto[]>(() => ({
    queryKey: ['clubs', 'public'],
    queryFn: async () => {
      const response = await clubsService.clubControllerFindAll({
        limit: 100,
        page: 1,
      });
      return response?.data ?? [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  }));

  /**
   * Get club by ID (returns a reactive query)
   */
  const getClubById = (idGetter: () => string): Query<ClubResponseDto> => {
    return injectQuery<ClubResponseDto>(() => ({
      queryKey: ['clubs', 'detail', idGetter()],
      queryFn: () => clubsService.clubControllerFindOne(idGetter()),
      enabled: !!idGetter(),
      staleTime: 5 * 60 * 1000, // 5 minutes
    }));
  };

  /**
   * Get club members by club ID (returns a reactive query)
   */
  const getClubMembers = (clubIdGetter: () => string): Query<ClubMemberResponseDto[]> => {
    return injectQuery<ClubMemberResponseDto[]>(() => ({
      queryKey: ['clubs', 'members', clubIdGetter()],
      queryFn: async () => {
        const clubId = clubIdGetter();
        if (!clubId) return [];
        const response = await clubsService.clubControllerGetMembers(clubId, {
          limit: 100,
          page: 1,
        });
        return response?.data ?? [];
      },
      enabled: !!clubIdGetter(),
      staleTime: 2 * 60 * 1000, // 2 minutes (members change more frequently)
    }));
  };

  /**
   * Get join requests by club ID (returns a reactive query)
   * Only fetches if user has management permissions
   */
  const getJoinRequests = (
    clubIdGetter: () => string,
    canManageGetter?: () => boolean
  ): Query<ClubJoinRequestResponseDto[]> => {
    return injectQuery<ClubJoinRequestResponseDto[]>(() => ({
      queryKey: ['clubs', 'join-requests', clubIdGetter()],
      queryFn: async () => {
        const clubId = clubIdGetter();
        if (!clubId) return [];
        const response = await clubsService.clubControllerGetJoinRequests(clubId, {
          limit: 100,
          page: 1,
          status: 'PENDING', // Only get pending requests
        });
        return response?.data ?? [];
      },
      // Only fetch if club ID exists AND user has permission
      enabled: !!clubIdGetter() && (canManageGetter ? canManageGetter() : true),
      staleTime: 1 * 60 * 1000, // 1 minute (join requests are time-sensitive)
    }));
  };

  // Mutation: Create Club
  const createClub = injectMutation<ClubResponseDto, CreateClubDto>({
    mutationFn: (data: CreateClubDto) => clubsService.clubControllerCreate(data),

    onSuccess: (newClub: ClubResponseDto) => {
      // Invalidate public clubs to include new club
      publicClubs.invalidate();
    },

    onError: (error: Error) => {
      // Error handling will be done in component
    },
  });

  // Mutation: Update Club
  const updateClub = injectMutation<ClubResponseDto, { id: string; data: UpdateClubDto }>({
    mutationFn: ({ id, data }) => clubsService.clubControllerUpdate(id, data),

    onSuccess: (updatedClub: ClubResponseDto, variables) => {
      // 1️⃣ Update cache immediately with fresh data (UX instantanée)
      const detailQueryKey = JSON.stringify(['clubs', 'detail', updatedClub.id]);
      const detailQuery = queryCache.get<ClubResponseDto>(detailQueryKey);
      if (detailQuery) {
        detailQuery.setDataFresh(updatedClub);
      }

      // 2️⃣ Invalidate my-clubs list to refresh ContextStore on next access
      queryCache.invalidateQueriesMatching(['clubs', 'my-clubs']);

      // 3️⃣ Invalidate public clubs list
      publicClubs.invalidate();
    },

    onError: (error: Error) => {
      // Error handling will be done in component
    },
  });

  // Mutation: Delete Club
  const deleteClub = injectMutation<void, string>({
    mutationFn: (id: string) => clubsService.clubControllerRemove(id),

    onSuccess: (_, clubId) => {
      // Invalidate public clubs
      publicClubs.invalidate();
    },

    onError: (error: Error) => {
      // Error handling will be done in component
    },
  });

  // Mutation: Join Club (creates join request, auto-joins if public + auto-approve)
  const joinClub = injectMutation<void, { clubId: string; data?: CreateJoinRequestDto }>({
    mutationFn: ({ clubId, data = {} }) => clubsService.clubControllerJoinClub(clubId, data),

    onSuccess: (_, variables) => {
      // Invalidate all club detail queries (components use ['clubs', 'detail'])
      queryCache.invalidateQueriesMatching(['clubs', 'detail']);

      // Invalidate all members queries
      queryCache.invalidateQueriesMatching(['clubs', 'members']);
    },

    onError: (error: Error) => {
      // Error handling will be done in component
    },
  });

  // Mutation: Join by Code
  const joinByCode = injectMutation<void, JoinByCodeDto>({
    mutationFn: (data: JoinByCodeDto) => clubsService.clubControllerJoinByCode(data),

    onSuccess: () => {
      // Invalidate public clubs list (in case they just joined a club)
      publicClubs.invalidate();
    },

    onError: (error: Error) => {
      // Error handling will be done in component
    },
  });

  // Mutation: Cancel Join Request
  const cancelJoinRequest = injectMutation<void, { clubId: string; requestId: string }>({
    mutationFn: ({ clubId, requestId }) =>
      clubsService.clubControllerCancelJoinRequest(clubId, requestId),

    onSuccess: (_, variables) => {
      // Invalidate join requests queries (remove from pending list)
      queryCache.invalidateQueriesMatching(['clubs', 'join-requests']);

      // Invalidate club detail (in case visibility depends on membership)
      queryCache.invalidateQueriesMatching(['clubs', 'detail']);
    },

    onError: (error: Error) => {
      // Error handling will be done in component
    },
  });

  // Mutation: Update Join Request (admin: approve/reject)
  const updateJoinRequest = injectMutation<void, { clubId: string; requestId: string; data: UpdateJoinRequestDto }>({
    mutationFn: ({ clubId, requestId, data }) =>
      clubsService.clubControllerUpdateJoinRequest(clubId, requestId, data),

    onSuccess: (_, variables) => {
      // Invalidate join requests queries (remove from pending list)
      queryCache.invalidateQueriesMatching(['clubs', 'join-requests']);

      // Invalidate all members queries (if approved, new member added)
      queryCache.invalidateQueriesMatching(['clubs', 'members']);

      // Invalidate all club detail queries (member count might change)
      queryCache.invalidateQueriesMatching(['clubs', 'detail']);
    },

    onError: (error: Error) => {
      // Error handling will be done in component
    },
  });

  return {
    publicClubs,
    getClubById,
    getClubMembers,
    getJoinRequests,
    createClub,
    updateClub,
    deleteClub,
    joinClub,
    joinByCode,
    cancelJoinRequest,
    updateJoinRequest,
  };
}
