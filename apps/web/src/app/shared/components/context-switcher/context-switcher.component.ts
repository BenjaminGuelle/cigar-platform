import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContextStore } from '../../../core/stores/context.store';

/**
 * Context Router Component (Web-specific)
 *
 * Routes content based on context (solo vs club).
 * Use with ng-content projection for maximum flexibility.
 *
 * Note: Renamed from ContextSwitcherComponent to avoid selector collision
 * with the mobile ContextSwitcherComponent (modal bottom sheet).
 *
 * Pattern:
 * - Declares content slots with [solo] and [club] attributes
 * - Automatically switches based on ContextStore
 * - Zero business logic - pure presentation shell
 *
 * Usage:
 * ```html
 * <app-context-router>
 *   <app-user-settings solo />
 *   <app-club-settings club />
 * </app-context-router>
 * ```
 *
 * Reusable for:
 * - Dashboard (UserDashboard | ClubDashboard)
 * - Settings (UserSettings | ClubSettings)
 * - Profile (UserProfile | ClubProfile)
 * - Events (UserEvents | ClubEvents)
 *
 * Architecture:
 * - Lives in apps/web/src/app/shared/components/ (web-specific)
 * - NOT in shared/ui (depends on ContextStore)
 */
@Component({
  selector: 'app-context-router',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (contextStore.context().type === 'solo') {
      <ng-content select="[solo]" />
    } @else if (contextStore.context().type === 'club') {
      <ng-content select="[club]" />
    }
  `,
})
export class ContextRouterComponent {
  contextStore = inject(ContextStore);
}
