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
      class="fixed bottom-0 left-0 right-0 z-20 px-4 md:hidden"
      style="padding-bottom: calc(0.5rem + env(safe-area-inset-bottom));"
    >
      <!-- Subtle gradient blur backdrop (mirrors header effect) -->
      <div
        class="pointer-events-none absolute inset-0 -top-6"
        style="
          background: linear-gradient(
            to top,
            rgba(23, 23, 23, 0.4) 0%,
            rgba(23, 23, 23, 0.2) 40%,
            rgba(23, 23, 23, 0) 100%
          );
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          mask-image: linear-gradient(to top, black 0%, black 40%, transparent 100%);
          -webkit-mask-image: linear-gradient(to top, black 0%, black 40%, transparent 100%);
        "
      ></div>

      <!-- Floating pill container - full width aligned with header px-4 -->
      <div
        class="relative flex w-full items-center justify-around rounded-full border border-smoke-600/40 bg-smoke-800/70 px-1 py-1.5 shadow-xl backdrop-blur-md"
      >
        <ng-content />
      </div>
    </nav>
  `,
})
export class MobileTabBarComponent {}