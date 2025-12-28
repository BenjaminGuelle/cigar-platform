import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { injectMutation, QueryCacheService } from '../query';
import type { Mutation } from '../query';
import { AuthService } from '../services/auth.service';
import type { AuthResult } from '../services/auth.service';

/**
 * Auth Store
 * Manages authentication mutations with Query Layer
 *
 * Features:
 * - All auth operations (signIn, signUp, resetPassword, etc.)
 * - Automatic loading/error states via Query Layer
 * - No more .subscribe() in components
 * - Consistent pattern across all auth flows
 *
 * Note: AuthService remains the source of truth for session/currentUser.
 * This store just wraps AuthService methods in Query Layer mutations.
 *
 * @example
 * ```typescript
 * @Component({...})
 * export class LoginComponent {
 *   authStore = injectAuthStore();
 *
 *   async onSubmit() {
 *     const result = await this.authStore.signIn.mutate({
 *       email: 'user@example.com',
 *       password: 'password123'
 *     });
 *
 *     if (result?.error) {
 *       // Handle error
 *     }
 *     // Navigation handled automatically by store
 *   }
 * }
 *
 * // Template
 * <ui-button
 *   [loading]="authStore.signIn.loading()"
 *   [disabled]="authStore.signIn.loading()"
 * >
 *   Se connecter
 * </ui-button>
 * ```
 */
export interface AuthStore {
  /**
   * Sign in with email/password
   */
  signIn: Mutation<AuthResult, { email: string; password: string }>;

  /**
   * Sign up new user
   */
  signUp: Mutation<AuthResult, { email: string; password: string; displayName: string }>;

  /**
   * Sign in with Google OAuth
   */
  signInWithGoogle: Mutation<AuthResult, void>;

  /**
   * Request password reset email
   */
  resetPassword: Mutation<AuthResult, { email: string }>;

  /**
   * Update password (after reset)
   */
  updatePassword: Mutation<AuthResult, { password: string }>;
}

/**
 * Inject Auth Store
 * Factory function that creates auth store with all auth mutations
 */
export function injectAuthStore(): AuthStore {
  const authService = inject(AuthService);
  const router = inject(Router);
  const queryCache = inject(QueryCacheService);

  // Mutation: Sign In
  const signIn = injectMutation<AuthResult, { email: string; password: string }>({
    mutationFn: ({ email, password }) =>
      firstValueFrom(authService.signIn(email, password)),
    onSuccess: (result: AuthResult) => {
      if (!result.error) {
        // Invalidate all club queries - user relationships have changed
        queryCache.invalidateQueriesMatching(['clubs']);
        router.navigate(['/']);
      }
    },
  });

  // Mutation: Sign Up
  const signUp = injectMutation<AuthResult, { email: string; password: string; displayName: string }>({
    mutationFn: ({ email, password, displayName }) =>
      firstValueFrom(authService.signUp(email, password, displayName)),
    onSuccess: (result: AuthResult) => {
      if (!result.error) {
        // Invalidate all club queries - new user, fresh start
        queryCache.invalidateQueriesMatching(['clubs']);
        router.navigate(['/']);
      }
    },
  });

  // Mutation: Sign In with Google
  const signInWithGoogle = injectMutation<AuthResult, void>({
    mutationFn: () => firstValueFrom(authService.signInWithGoogle()),
    // Note: Google OAuth redirects to Google, so no navigation here
  });

  // Mutation: Request Password Reset
  const resetPassword = injectMutation<AuthResult, { email: string }>({
    mutationFn: ({ email }) =>
      firstValueFrom(authService.resetPassword(email)),
    // Note: No navigation on success, component shows success message
  });

  // Mutation: Update Password
  const updatePassword = injectMutation<AuthResult, { password: string }>({
    mutationFn: ({ password }) =>
      firstValueFrom(authService.updatePassword(password)),
    onSuccess: (result: AuthResult) => {
      if (!result.error) {
        // Navigation handled in component with delay for success message
      }
    },
  });

  return {
    signIn,
    signUp,
    signInWithGoogle,
    resetPassword,
    updatePassword,
  };
}
