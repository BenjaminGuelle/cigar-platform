import { Component } from '@angular/core';
import { ContextSwitcherComponent } from '../../../shared/components/context-switcher/context-switcher.component';
import { DashboardUserPage } from './user/dashboard-user.page';
import { DashboardClubPage } from './club/dashboard-club.page';

/**
 * Dashboard Context Page (Shell)
 *
 * Route: /dashboard
 * Architecture: Context-driven routing shell
 *
 * Pattern:
 * - Zero business logic (pure shell)
 * - Uses generic ContextSwitcherComponent
 * - Switches between DashboardUserPage and DashboardClubPage
 * - Based on ContextStore.context()
 *
 * The context selects the page.
 * The page never decides the context.
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    ContextSwitcherComponent,
    DashboardUserPage,
    DashboardClubPage,
  ],
  template: `
    <app-context-switcher>
      <app-dashboard-user solo />
      <app-dashboard-club club />
    </app-context-switcher>
  `,
})
export class DashboardComponent {}
