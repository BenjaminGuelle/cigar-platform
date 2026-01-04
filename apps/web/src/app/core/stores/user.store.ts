import { inject, signal } from '@angular/core';
import { injectQuery, injectMutation } from '../query';
import type { Query, Mutation } from '../query';
import { AuthService } from '../services/auth.service';
import { AuthenticationService } from '@cigar-platform/types/lib/authentication/authentication.service';
import { UsersService } from '@cigar-platform/types/lib/users/users.service';
import type {
  UserDto,
  UpdateProfileDto,
  UserPublicProfileDto,
  ClubResponseDto,
  UserProfileStatsResponseDto,
} from '@cigar-platform/types';

/**
 * User Store
 * Manages current user state with Query Layer
 *
 * Features:
 * - Auto-fetch current user on init
 * - Optimistic updates for profile changes
 * - Shared across all components
 *
 * @example
 * ```typescript
 * @Component({...})
 * export class ProfileComponent {
 *   userStore = injectUserStore();
 *
 *   user = this.userStore.currentUser.data;
 *   loading = this.userStore.currentUser.loading;
 *
 *   async updateProfile(data: UpdateProfileDto) {
 *     await this.userStore.updateProfile.mutate(data);
 *   }
 * }
 * ```
 */
export interface UserStore {
  /**
   * Current authenticated user query
   */
  currentUser: Query<UserDto>;

  /**
   * Get profile stats for current user (Solo context)
   * Includes parcours, aroma signature, terroirs, and journal
   */
  profileStats: Query<UserProfileStatsResponseDto>;

  /**
   * Get public profile for a user by ID (reactive - pass a getter function)
   */
  getUserPublicProfile: (userIdGetter: () => string) => Query<UserPublicProfileDto>;

  /**
   * Get clubs for a user by ID (reactive - pass a getter function)
   */
  getUserClubs: (userIdGetter: () => string, limitGetter?: () => number) => Query<ClubResponseDto[]>;

  /**
   * Update user profile mutation
   */
  updateProfile: Mutation<UserDto, UpdateProfileDto>;

  /**
   * Upload user avatar mutation
   */
  uploadAvatar: Mutation<unknown, { avatar: File }>;
}

/**
 * Inject User Store
 * Factory function that creates user store with queries and mutations
 *
 * Hydration Strategy:
 * - One-shot hydration from AuthService on init (no continuous sync)
 * - UserStore becomes source of truth after hydration
 * - True optimistic updates with rollback on error
 */
export function injectUserStore(): UserStore {
  const authService = inject(AuthService);
  const authApiService = inject(AuthenticationService);
  const usersService = inject(UsersService);

  // Query: Current User (disabled auto-fetch, uses AuthService as source)
  const currentUser = injectQuery<UserDto>(() => ({
    queryKey: ['user', 'current'],
    queryFn: () => authApiService.authControllerGetProfile(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: false, // Disable auto-fetch, we'll hydrate from AuthService
  }));

  // One-shot hydration from AuthService (no continuous effect!)
  const initialUser = authService.currentUser();
  if (initialUser) {
    currentUser.setDataFresh(initialUser as UserDto);
  }

  // Query: Profile Stats for current user (Solo context)
  const profileStats = injectQuery<UserProfileStatsResponseDto>(() => ({
    queryKey: ['users', 'profile-stats', 'me'],
    queryFn: () => usersService.usersControllerGetProfileStats(),
    staleTime: 2 * 60 * 1000, // 2 minutes (stats may change after tastings)
    enabled: !!initialUser, // Only fetch if user is authenticated
  }));

  /**
   * Get public profile for a user by ID (returns a reactive query)
   */
  const getUserPublicProfile = (userIdGetter: () => string): Query<UserPublicProfileDto> => {
    return injectQuery<UserPublicProfileDto>(() => ({
      queryKey: ['users', 'profile', userIdGetter()],
      queryFn: () => usersService.usersControllerGetPublicProfile(userIdGetter()),
      enabled: !!userIdGetter(),
      staleTime: 5 * 60 * 1000, // 5 minutes
    }));
  };

  /**
   * Get clubs for a user by ID (returns a reactive query)
   */
  const getUserClubs = (
    userIdGetter: () => string,
    limitGetter?: () => number
  ): Query<ClubResponseDto[]> => {
    return injectQuery<ClubResponseDto[]>(() => ({
      queryKey: ['users', 'clubs', userIdGetter(), limitGetter?.() ?? 6],
      queryFn: async () => {
        const userId = userIdGetter();
        if (!userId) return [];
        const clubs = await usersService.usersControllerGetUserClubs(userId, {
          limit: limitGetter?.() ?? 6,
        });
        return clubs ?? [];
      },
      enabled: !!userIdGetter(),
      staleTime: 5 * 60 * 1000, // 5 minutes
    }));
  };

  // Mutation: Update Profile with TRUE optimistic update
  const updateProfile = injectMutation<UserDto, UpdateProfileDto>({
    mutationFn: (data: UpdateProfileDto) => authApiService.authControllerUpdateProfile(data),

    onMutate: (variables: UpdateProfileDto) => {
      const previousUser = currentUser.data();

      // Optimistic update: Apply ALL changes immediately
      if (previousUser) {
        const optimisticUser: UserDto = {
          ...previousUser,
          ...(variables.displayName !== undefined && { displayName: variables.displayName }),
          ...(variables.username !== undefined && { username: variables.username }),
          ...(variables.bio !== undefined && { bio: variables.bio }),
          ...(variables.visibility !== undefined && { visibility: variables.visibility }),
          ...(variables.shareEvaluationsPublicly !== undefined && { shareEvaluationsPublicly: variables.shareEvaluationsPublicly }),
        };
        currentUser.setData(optimisticUser);
      }

      // Return context for rollback
      return { previousUser };
    },

    onSuccess: (updatedUser: UserDto) => {
      // Replace optimistic data with real server data + mark as fresh
      currentUser.setDataFresh(updatedUser);

      // Sync with AuthService to update all components using AuthService.currentUser
      authService.updateCurrentUser(updatedUser);
    },

    onError: (error: Error, _variables: UpdateProfileDto, context) => {
      // Rollback to previous user data
      if (context?.['previousUser']) {
        currentUser.setData(context['previousUser'] as UserDto);
      }
    },
  });

  // Mutation: Upload Avatar
  const uploadAvatar = injectMutation<{ avatarUrl: string }, { avatar: File }>({
    mutationFn: (variables: { avatar: File }) =>
      usersService.usersControllerUploadAvatar(variables),

    onMutate: () => {
      // Return previous user for rollback
      return { previousUser: currentUser.data() };
    },

    onSuccess: (response) => {
      const newAvatarUrl = response.avatarUrl;
      const previousUser = currentUser.data();

      // Optimistic update: Immediately update avatar URL
      if (previousUser) {
        const updatedUser: UserDto = {
          ...previousUser,
          avatarUrl: newAvatarUrl,
        };
        currentUser.setDataFresh(updatedUser);

        // Sync with AuthService to update all components using AuthService.currentUser
        authService.updateCurrentUser(updatedUser);
      }
    },

    onError: (error: Error, _variables, context) => {
      // Rollback to previous user data
      if (context?.['previousUser']) {
        const previousUser = context['previousUser'] as UserDto;
        currentUser.setData(previousUser);
        authService.updateCurrentUser(previousUser);
      }
    },
  });

  return {
    currentUser,
    profileStats,
    getUserPublicProfile,
    getUserClubs,
    updateProfile,
    uploadAvatar,
  };
}
