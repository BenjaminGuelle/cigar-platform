import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ContextStore } from '../../core/stores/context.store';
import { AppShellComponent } from '../../shared/components/app-shell';

/**
 * Home Component
 *
 * Root layout component for authenticated pages.
 * Uses AppShell for all layout concerns (header, sidebar, tabs, modals).
 * Only handles business logic like context hydration.
 *
 * Following ALL STARS architecture:
 * - Layout: delegated to AppShellComponent
 * - Business logic: context initialization
 */
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterOutlet, AppShellComponent],
  template: `
    <app-shell>
      <router-outlet />
    </app-shell>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  readonly #contextStore = inject(ContextStore);

  constructor() {
    // Senior Dev Pattern: Load clubs + hydrate context after authentication
    // APP_INITIALIZER only restored clubId from localStorage (optimistic state)
    // Now we load real data and hydrate the "pending" club context
    this.#contextStore.loadUserClubs().then(() => {
      const context = this.#contextStore.context();

      // If we have a club context but no club data, hydrate it
      if (context.type === 'club' && context.clubId && !context.club) {
        this.#contextStore.hydrateClubContext(context.clubId);
      }
    });
  }
}