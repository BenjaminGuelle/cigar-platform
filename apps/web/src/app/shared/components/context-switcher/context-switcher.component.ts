import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContextStore } from '../../../core/stores/context.store';

/**
 * Context Switcher Component (Web-specific)
 *
 * Generic component that switches content based on context (solo vs club).
 * Use with ng-content projection for maximum flexibility.
 *
 * Pattern:
 * - Declares content slots with [solo] and [club] attributes
 * - Automatically switches based on ContextStore
 * - Zero business logic - pure presentation shell
 *
 * Usage:
 * ```html
 * <app-context-switcher>
 *   <app-user-settings solo />
 *   <app-club-settings club />
 * </app-context-switcher>
 * ```
 *
 * Reusable for:
 * - Dashboard (UserDashboard | ClubDashboard)
 * - Settings (UserSettings | ClubSettings)
 * - Degustations (UserDegustations | ClubDegustations)
 * - Events (UserEvents | ClubEvents)
 *
 * Architecture:
 * - Lives in apps/web/src/app/shared/components/ (web-specific)
 * - NOT in shared/ui (depends on ContextStore)
 */
@Component({
  selector: 'app-context-switcher',
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
export class ContextSwitcherComponent {
  contextStore = inject(ContextStore);
}
