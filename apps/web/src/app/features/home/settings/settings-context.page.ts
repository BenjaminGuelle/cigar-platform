import { Component } from '@angular/core';
import { ContextRouterComponent } from '../../../shared/components/context-switcher/context-switcher.component';
import { UserSettingsPage } from './user/user-settings.page';
import { ClubSettingsPage } from './club/club-settings.page';

/**
 * Settings Context Page (Shell)
 *
 * Route: /settings
 * Architecture: Context-driven routing shell
 *
 * Pattern:
 * - Zero business logic (pure shell)
 * - Uses generic ContextRouterComponent
 * - Switches between UserSettingsPage and ClubSettingsPage
 * - Based on ContextStore.context()
 *
 * The context selects the page.
 * The page never decides the context.
 *
 * Similar to: Slack, Discord, GitHub navigation
 */
@Component({
  selector: 'app-settings-context',
  standalone: true,
  imports: [
    ContextRouterComponent,
    UserSettingsPage,
    ClubSettingsPage,
  ],
  template: `
    <app-context-router>
      <app-user-settings solo />
      <app-club-settings club />
    </app-context-router>
  `,
})
export class SettingsContextPage {}
