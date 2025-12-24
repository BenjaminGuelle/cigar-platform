import { inject, signal } from '@angular/core';
import { injectQuery, injectMutation } from '../query';
import type { Query, Mutation } from '../query';
import { AuthService } from '../services/auth.service';
import { AuthenticationService } from '@cigar-platform/types/lib/authentication/authentication.service';
import type {
  UserDto,
  UpdateProfileDto,
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
   * Update user profile mutation
   */
  updateProfile: Mutation<UserDto, UpdateProfileDto>;
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

  // Query: Current User (disabled auto-fetch, uses AuthService as source)
  const currentUser = injectQuery<UserDto>({
    queryKey: ['user', 'current'],
    queryFn: () => authApiService.authControllerGetProfile(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: signal(false), // Disable auto-fetch, we'll hydrate from AuthService
  });

  // One-shot hydration from AuthService (no continuous effect!)
  const initialUser = authService.currentUser();
  if (initialUser) {
    currentUser.setDataFresh(initialUser as UserDto);
  }

  // Mutation: Update Profile with TRUE optimistic update
  const updateProfile = injectMutation<UserDto, UpdateProfileDto>({
    mutationFn: (data: UpdateProfileDto) => authApiService.authControllerUpdateProfile(data),

    // Phase 1: Before API call - Optimistic update
    onMutate: (variables: UpdateProfileDto) => {
      const previousUser = currentUser.data();

      // Optimistic update: Apply changes immediately
      if (previousUser) {
        const optimisticUser: UserDto = {
          ...previousUser,
          ...(variables.displayName && { displayName: variables.displayName }),
        };
        currentUser.setData(optimisticUser);
      }

      // Return context for rollback
      return { previousUser };
    },

    // Phase 2: API success - Confirm with server data
    onSuccess: (updatedUser: UserDto) => {
      // Replace optimistic data with real server data + mark as fresh
      currentUser.setDataFresh(updatedUser);
    },

    // Phase 3: API error - Rollback to previous state
    onError: (error: Error, variables: UpdateProfileDto, context) => {
      // Rollback to previous user data
      if (context?.['previousUser']) {
        currentUser.setData(context['previousUser'] as UserDto);
      }
      console.error('[UserStore] Update profile failed:', error);
    },
  });

  return {
    currentUser,
    updateProfile,
  };
}
