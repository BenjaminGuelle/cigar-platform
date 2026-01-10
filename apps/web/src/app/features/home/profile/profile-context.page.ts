import { Component } from '@angular/core';
import { ContextRouterComponent } from '../../../shared/components/context-switcher/context-switcher.component';
import { UserProfilePage } from './user/user-profile.page';
import { ClubProfilePage } from './club/club-profile.page';

/**
 * Profile Context Page (Shell)
 *
 * Route: /profile
 * Architecture: Context-driven routing shell
 *
 * Pattern:
 * - Zero business logic (pure shell)
 * - Uses generic ContextRouterComponent
 * - Switches between UserProfilePage and ClubProfilePage
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
    UserProfilePage,
    ClubProfilePage,
  ],
  template: `
    <app-context-router>
      <app-user-profile solo />
      <app-club-profile club />
    </app-context-router>
  `,
})
export class ProfileContextPage {}
