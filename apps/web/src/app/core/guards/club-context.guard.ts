import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { ContextStore } from '../stores/context.store';

/**
 * Club Context Guard
 *
 * Ensures user is in club context before accessing club-specific routes.
 *
 * Protected routes:
 * - /membres (club members)
 * - /evenements (club events, future)
 * - /degustations (club tastings, future)
 *
 * Note: /settings is NOT protected by this guard because it uses
 * the SettingsContextPage shell that handles context switching internally.
 *
 * Architecture:
 * - Context-driven navigation (Slack/Discord style)
 * - Routes are NOT nested under /club/:id
 * - Uses ContextStore.context() to check active context
 *
 * Behavior:
 * - If context = club → Allow access
 * - If context = solo → Redirect to /explore (user must select a club first)
 *
 * @example
 * ```typescript
 * {
 *   path: 'membres',
 *   canActivate: [clubContextGuard],
 *   loadComponent: () => import('./members.page').then(m => m.MembersPage)
 * }
 * ```
 */
export const clubContextGuard: CanActivateFn = () => {
  const contextStore = inject(ContextStore);
  const router = inject(Router);

  const context = contextStore.context();

  // Check if user is in club context
  if (context.type === 'club' && context.clubId) {
    return true;
  }

  // User is in solo context, redirect to explore
  // They need to select a club first
  router.navigate(['/explore']);
  return false;
};
