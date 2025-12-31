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
  ClubBanResponseDto,
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
   * Get banned members by club ID (reactive - pass getter functions)
   * @param clubIdGetter - Getter for club ID
   * @param canManageGetter - Getter for permission check (optional, defaults to true)
   */
  getBannedMembers: (clubIdGetter: () => string, canManageGetter?: () => boolean) => Query<ClubBanResponseDto[]>;

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
   * Upload club avatar mutation
   */
  uploadClubAvatar: Mutation<unknown, { clubId: string; avatar: File }>;

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

  /**
   * Update member role mutation (admin: promote/demote)
   */
  updateMemberRole: Mutation<void, { clubId: string; userId: string; role: 'owner' | 'admin' | 'member' }>;

  /**
   * Transfer ownership mutation (owner only: transfer club ownership to another member)
   */
  transferOwnership: Mutation<void, { clubId: string; newOwnerId: string }>;

  /**
   * Remove member mutation (admin: kick from club)
   */
  removeMember: Mutation<void, { clubId: string; userId: string }>;

  /**
   * Ban member mutation (admin: ban + remove from club)
   */
  banMember: Mutation<void, { clubId: string; userId: string; reason?: string }>;

  /**
   * Unban member mutation (admin: remove ban)
   */
  unbanMember: Mutation<void, { clubId: string; userId: string }>;
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

  /**
   * Get banned members by club ID (returns a reactive query)
   * Only fetches if user has management permissions
   */
  const getBannedMembers = (
    clubIdGetter: () => string,
    canManageGetter?: () => boolean
  ): Query<ClubBanResponseDto[]> => {
    return injectQuery<ClubBanResponseDto[]>(() => ({
      queryKey: ['clubs', 'bans', clubIdGetter()],
      queryFn: async () => {
        const clubId = clubIdGetter();
        if (!clubId) return [];
        const response = await clubsService.clubControllerGetBannedMembers(clubId, {
          limit: 100,
          page: 1,
        });
        return response?.data ?? [];
      },
      // Only fetch if club ID exists AND user has permission
      enabled: !!clubIdGetter() && (canManageGetter ? canManageGetter() : true),
      staleTime: 2 * 60 * 1000, // 2 minutes (bans don't change frequently)
    }));
  };

  // Mutation: Create Club
  const createClub = injectMutation<ClubResponseDto, CreateClubDto>({
    mutationFn: (data: CreateClubDto) => clubsService.clubControllerCreate(data),

    onSuccess: (newClub: ClubResponseDto) => {
      // Invalidate public clubs to include new club
      publicClubs.invalidate();

      // Invalidate my-clubs to refresh user's club list in ContextStore
      queryCache.invalidateQueriesMatching(['clubs', 'my-clubs']);
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

      // Invalidate my-clubs to refresh user's club list in ContextStore
      queryCache.invalidateQueriesMatching(['clubs', 'my-clubs']);
    },

    onError: (error: Error) => {
      // Error handling will be done in component
    },
  });

  // Mutation: Upload Club Avatar
  const uploadClubAvatar = injectMutation<{ imageUrl: string }, { clubId: string; avatar: File }>({
    mutationFn: (variables: { clubId: string; avatar: File }) =>
      clubsService.clubControllerUploadAvatar(variables.clubId, { avatar: variables.avatar }),

    onMutate: (variables) => {
      // Save previous state for rollback
      const detailQueryKey = JSON.stringify(['clubs', 'detail', variables.clubId]);
      const detailQuery = queryCache.get<ClubResponseDto>(detailQueryKey);
      const previousDetailClub = detailQuery?.data();

      const myClubsQueryKey = JSON.stringify(['clubs', 'my-clubs']);
      const myClubsQuery = queryCache.get<ClubResponseDto[]>(myClubsQueryKey);
      const previousMyClubs = myClubsQuery?.data();

      return { previousDetailClub, previousMyClubs };
    },

    onSuccess: (response, variables) => {
      const newImageUrl = response.imageUrl;

      // Optimistic update: Immediately update club detail cache with new imageUrl
      const detailQueryKey = JSON.stringify(['clubs', 'detail', variables.clubId]);
      const detailQuery = queryCache.get<ClubResponseDto>(detailQueryKey);
      if (detailQuery && detailQuery.data()) {
        const currentClub = detailQuery.data();
        if (currentClub) {
          const updatedClub: ClubResponseDto = {
            ...currentClub,
            imageUrl: newImageUrl,
          };
          detailQuery.setDataFresh(updatedClub);
        }
      }

      // Optimistic update: Update my-clubs cache with new imageUrl
      const myClubsQueryKey = JSON.stringify(['clubs', 'my-clubs']);
      const myClubsQuery = queryCache.get<ClubResponseDto[]>(myClubsQueryKey);
      if (myClubsQuery && myClubsQuery.data()) {
        const currentClubs = myClubsQuery.data();
        if (currentClubs) {
          const updatedClubs = currentClubs.map((club) =>
            club.id === variables.clubId ? { ...club, imageUrl: newImageUrl } : club
          );
          myClubsQuery.setDataFresh(updatedClubs);
        }
      }
    },

    onError: (error: Error, variables, context) => {
      // Rollback to previous state
      if (context?.['previousDetailClub']) {
        const detailQueryKey = JSON.stringify(['clubs', 'detail', variables.clubId]);
        const detailQuery = queryCache.get<ClubResponseDto>(detailQueryKey);
        if (detailQuery) {
          detailQuery.setData(context['previousDetailClub'] as ClubResponseDto);
        }
      }

      if (context?.['previousMyClubs']) {
        const myClubsQueryKey = JSON.stringify(['clubs', 'my-clubs']);
        const myClubsQuery = queryCache.get<ClubResponseDto[]>(myClubsQueryKey);
        if (myClubsQuery) {
          myClubsQuery.setData(context['previousMyClubs'] as ClubResponseDto[]);
        }
      }
    },
  });

  // Mutation: Join Club (creates join request, auto-joins if public + auto-approve)
  const joinClub = injectMutation<void, { clubId: string; data?: CreateJoinRequestDto }>({
    mutationFn: ({ clubId, data = {} }) => clubsService.clubControllerJoinClub(clubId, data),

    onSuccess: (_, variables) => {
      // Optimistic update: Find ALL detail queries for this club (by ID or slug)
      // Pages can use either ID or slug, so we search by club.id in the data
      const detailQueries = queryCache.findQueries<ClubResponseDto>(
        ['clubs', 'detail'],
        (club) => club?.id === variables.clubId
      );

      // Update all found queries (handles both ID and slug cases)
      for (const query of detailQueries) {
        const currentClub = query.data();
        if (!currentClub) continue;

        // Determine new status based on club settings
        const isPublic = currentClub.visibility === 'PUBLIC';
        const autoApprove = currentClub.autoApproveMembers ?? false;
        const willBeAutoApproved = isPublic && autoApprove;

        const updatedClub: ClubResponseDto = {
          ...currentClub,
          currentUserStatus: willBeAutoApproved ? 'member' : 'pending',
          currentUserRole: willBeAutoApproved ? 'member' : undefined,
          memberCount: willBeAutoApproved ? currentClub.memberCount + 1 : currentClub.memberCount,
        };

        query.setDataFresh(updatedClub);
      }

      // Invalidate all club detail queries (catches any we might have missed)
      queryCache.invalidateQueriesMatching(['clubs', 'detail']);

      // Invalidate members queries (background refresh)
      queryCache.invalidateQueriesMatching(['clubs', 'members']);

      // Invalidate my-clubs to refresh user's club list in ContextStore
      queryCache.invalidateQueriesMatching(['clubs', 'my-clubs']);
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

      // Invalidate my-clubs to refresh user's club list in ContextStore
      queryCache.invalidateQueriesMatching(['clubs', 'my-clubs']);
    },

    onError: (error: Error) => {
      // Error handling will be done in component
    },
  });

  // Mutation: Cancel Join Request
  const cancelJoinRequest = injectMutation<void, { clubId: string; requestId: string }>({
    mutationFn: ({ clubId, requestId }) =>
      clubsService.clubControllerCancelJoinRequest(clubId, requestId),

    onSuccess: async (_, variables) => {
      // 1. Marquer les données comme périmées
      queryCache.invalidateQueriesMatching(['clubs', 'join-requests', variables.clubId]);
      queryCache.invalidateQueriesMatching(['clubs', 'detail', variables.clubId]);

      // 2. Forcer le refetch SANS attendre (async non-bloquant)
      const joinRequestsQuery = queryCache.get(JSON.stringify(['clubs', 'join-requests', variables.clubId]));
      const detailQuery = queryCache.get(JSON.stringify(['clubs', 'detail', variables.clubId]));

      if (joinRequestsQuery) void joinRequestsQuery.refetch();
      if (detailQuery) void detailQuery.refetch();
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
      // 1. Optimistic update: retirer la request de la liste immédiatement
      const joinRequestsQueryKey = JSON.stringify(['clubs', 'join-requests', variables.clubId]);
      const joinRequestsQuery = queryCache.get(joinRequestsQueryKey);

      if (joinRequestsQuery) {
        const currentRequests = joinRequestsQuery.data() as ClubJoinRequestResponseDto[] | null;
        if (currentRequests) {
          const updatedRequests = currentRequests.filter(r => r.id !== variables.requestId);
          joinRequestsQuery.setDataFresh(updatedRequests);
        }
      }

      // 2. Background refetch de la liste des membres (pour voir le nouveau membre si APPROVED)
      if (variables.data.status === 'APPROVED') {
        const membersQueryKey = JSON.stringify(['clubs', 'members', variables.clubId]);
        const membersQuery = queryCache.get(membersQueryKey);
        if (membersQuery) void membersQuery.refetchInBackground();
      }

      // 3. Invalidate detail pour refetch automatique plus tard
      queryCache.invalidateQueriesMatching(['clubs', 'detail', variables.clubId]);
    },

    onError: (error: Error) => {
      // Error handled by component
    },
  });

  // Mutation: Update Member Role (admin: promote/demote)
  const updateMemberRole = injectMutation<void, { clubId: string; userId: string; role: 'owner' | 'admin' | 'member' }>({
    mutationFn: ({ clubId, userId, role }) =>
      clubsService.clubControllerUpdateMemberRole(clubId, userId, { role }),

    onSuccess: (_, variables) => {
      // Update cache optimistically - instant UI update
      const membersQueryKey = JSON.stringify(['clubs', 'members', variables.clubId]);
      const membersQuery = queryCache.get<ClubMemberResponseDto[]>(membersQueryKey);

      if (membersQuery && membersQuery.data()) {
        const currentMembers = membersQuery.data() ?? [];
        const updatedMembers = currentMembers.map(member =>
          member.userId === variables.userId
            ? { ...member, role: variables.role }
            : member
        );
        membersQuery.setDataFresh(updatedMembers);
      }
    },

    onError: (error: Error) => {
      // Error handling will be done in component
    },
  });

  // Mutation: Transfer Ownership (owner only: transfer club to another member)
  const transferOwnership = injectMutation<void, { clubId: string; newOwnerId: string }>({
    mutationFn: ({ clubId, newOwnerId }) =>
      clubsService.clubControllerTransferOwnership(clubId, { newOwnerId }),

    onSuccess: (_, variables) => {
      // Invalidate all queries for this club (major state change)
      queryCache.invalidateQueriesMatching(['clubs', 'detail', variables.clubId]);
      queryCache.invalidateQueriesMatching(['clubs', 'members', variables.clubId]);
      queryCache.invalidateQueriesMatching(['clubs', 'my-clubs']);

      // Note: User will likely lose admin access, so component should handle navigation
    },

    onError: (error: Error) => {
      // Error handling will be done in component
    },
  });

  // Mutation: Remove Member (admin: kick from club)
  const removeMember = injectMutation<void, { clubId: string; userId: string }>({
    mutationFn: ({ clubId, userId }) =>
      clubsService.clubControllerRemoveMember(clubId, userId),

    onSuccess: (_, variables) => {
      // Optimistic update: retirer le membre de la liste immédiatement
      const membersQueryKey = JSON.stringify(['clubs', 'members', variables.clubId]);
      const membersQuery = queryCache.get(membersQueryKey);

      if (membersQuery) {
        const currentMembers = membersQuery.data() as ClubMemberResponseDto[] | null;
        if (currentMembers) {
          const updatedMembers = currentMembers.filter(m => m.userId !== variables.userId);
          membersQuery.setDataFresh(updatedMembers);
        }
      }

      // Invalidate pour refetch automatique plus tard
      queryCache.invalidateQueriesMatching(['clubs', 'detail', variables.clubId]);
    },

    onError: (error: Error) => {
      // Error handling will be done in component
    },
  });

  // Mutation: Ban Member (admin: ban + remove from club)
  const banMember = injectMutation<void, { clubId: string; userId: string; reason?: string }>({
    mutationFn: ({ clubId, userId, reason }) =>
      clubsService.clubControllerBanMember(clubId, userId, { reason }),

    onSuccess: (_, variables) => {
      // 1. Optimistic update: retirer le membre de la liste immédiatement
      const membersQueryKey = JSON.stringify(['clubs', 'members', variables.clubId]);
      const membersQuery = queryCache.get(membersQueryKey);

      if (membersQuery) {
        const currentMembers = membersQuery.data() as ClubMemberResponseDto[] | null;
        if (currentMembers) {
          const updatedMembers = currentMembers.filter(m => m.userId !== variables.userId);
          membersQuery.setDataFresh(updatedMembers);
        }
      }

      // 2. Background refetch de la liste des bans (pour voir le nouveau ban)
      const bansQueryKey = JSON.stringify(['clubs', 'bans', variables.clubId]);
      const bansQuery = queryCache.get(bansQueryKey);
      if (bansQuery) void bansQuery.refetchInBackground();

      // 3. Invalidate detail pour refetch automatique plus tard
      queryCache.invalidateQueriesMatching(['clubs', 'detail', variables.clubId]);
    },

    onError: (error: Error) => {
      // Error handling will be done in component
    },
  });

  // Mutation: Unban Member (admin: remove ban)
  const unbanMember = injectMutation<void, { clubId: string; userId: string }>({
    mutationFn: ({ clubId, userId }) =>
      clubsService.clubControllerUnbanMember(clubId, userId),

    onSuccess: (_, variables) => {
      // Optimistic update: retirer le ban de la liste immédiatement
      const bansQueryKey = JSON.stringify(['clubs', 'bans', variables.clubId]);
      const bansQuery = queryCache.get(bansQueryKey);

      if (bansQuery) {
        const currentBans = bansQuery.data() as ClubBanResponseDto[] | null;
        if (currentBans) {
          const updatedBans = currentBans.filter(b => b.userId !== variables.userId);
          bansQuery.setDataFresh(updatedBans);
        }
      }
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
    getBannedMembers,
    createClub,
    updateClub,
    deleteClub,
    uploadClubAvatar,
    joinClub,
    joinByCode,
    cancelJoinRequest,
    updateJoinRequest,
    updateMemberRole,
    transferOwnership,
    removeMember,
    banMember,
    unbanMember,
  };
}
