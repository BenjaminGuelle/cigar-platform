import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Bottom Tab Bar Component - Mobile navigation
 * iOS-style bottom navigation with backdrop blur and modern animations
 */
@Component({
  selector: 'ui-bottom-tab-bar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <nav class="fixed bottom-0 left-0 right-0 z-[20] md:hidden">
      <div class="relative border-t border-smoke-800 backdrop-blur-xl">
        <div class="flex items-center justify-around px-2 pb-6 pt-2">
          <ng-content />
        </div>
      </div>
    </nav>
  `,
})
export class BottomTabBarComponent {}