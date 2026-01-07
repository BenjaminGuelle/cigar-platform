import { Component } from '@angular/core';
import { ContextRouterComponent } from '../../../shared/components/context-switcher/context-switcher.component';
import { UserProfilePrivatePage } from './user/user-profile-private.page';
import { ClubProfilePrivatePage } from './club/club-profile-private.page';

/**
 * Profile Context Page (Shell)
 *
 * Route: /profile
 * Architecture: Context-driven routing shell
 *
 * Pattern:
 * - Zero business logic (pure shell)
 * - Uses generic ContextRouterComponent
 * - Switches between UserProfilePrivatePage and ClubProfilePrivatePage
 * - Based on ContextStore.context()
 *
 * The context selects the page.
 * The page never decides the context.
 *
 * Similar to: Slack, Discord, GitHub navigation
 */
@Component({
  selector: 'app-profile-context',
  standalone: true,
  imports: [
    ContextRouterComponent,
    UserProfilePrivatePage,
    ClubProfilePrivatePage,
  ],
  template: `
    <app-context-router>
      <app-user-profile-private solo />
      <app-club-profile-private club />
    </app-context-router>
  `,
})
export class ProfileContextPage {}
