import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Mobile Tab Bar Component
 * Floating pill-shaped bottom navigation with glassmorphism
 * Safe area support for PWA (iPhone home indicator)
 */
@Component({
  selector: 'app-mobile-tab-bar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <nav
      class="fixed bottom-0 left-0 right-0 z-20 flex justify-center px-4 md:hidden"
      style="padding-bottom: calc(0.75rem + env(safe-area-inset-bottom))"
    >
      <!-- Floating pill container -->
      <div
        class="flex items-center justify-around rounded-full border border-smoke-600/40 bg-smoke-800/70 px-2 py-2 shadow-xl backdrop-blur-md"
      >
        <ng-content />
      </div>
    </nav>
  `,
})
export class MobileTabBarComponent {}