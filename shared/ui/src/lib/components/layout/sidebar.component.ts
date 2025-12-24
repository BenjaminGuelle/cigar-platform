import { Component, signal, WritableSignal, Signal, computed, effect, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import clsx from 'clsx';
import { LogoComponent } from '../logo/logo.component';

@Component({
  selector: 'ui-sidebar',
  standalone: true,
  imports: [CommonModule, LogoComponent],
  template: `
    <aside class="fixed left-0 top-0 z-40 flex flex-col h-screen bg-smoke-700 border-r border-smoke-700 transition-all duration-500 ease-in-out"
           [class]="sidebarClasses()"
    >
      <div class="relative flex pl-6 items-center border-b border-smoke-700 overflow-hidden px-3 py-4 transition-all duration-500 ease-in-out">
        <div class="flex w-11 shrink-0 items-center justify-center">
          <ui-logo variant="compact" />
        </div>

        <div [class]="fullLogoClasses()">
          <ui-logo variant="full" size="sm" [showTagline]="false" />
        </div>

          <!-- TODO: Use always ui component first, here : <ui-button></ui-button> with icon or <i [name]  -->
        <button
          (click)="toggleSidebar()"
          [class]="toggleButtonClasses()"
          type="button"
          aria-label="Toggle sidebar"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            [class]="chevronClasses()"
          >
            <path d="m9 18 6-6-6-6"/>
          </svg>
        </button>
      </div>

      <nav class="flex-1 p-3 overflow-y-auto border-t border-smoke-600">
        <ng-content />
      </nav>

      <div class="border-t border-smoke-600 p-4">
        <ng-content select="[slot=footer]" />
      </div>
    </aside>
  `,
})
export class SidebarComponent {
  readonly #STORAGE_KEY = 'sidebar-expanded';

  readonly subSidebarActive = input<boolean>(false);

  readonly isExpanded: WritableSignal<boolean> = signal<boolean>(
    this.#loadStateFromStorage()
  );

  readonly sidebarClasses: Signal<string> = computed<string>(() => {
    // Force collapsed (icon-only) when sub-sidebar is active
    if (this.subSidebarActive()) {
      return 'w-22';
    }
    return this.isExpanded() ? 'w-70' : 'w-22';
  });

  readonly fullLogoClasses: Signal<string> = computed<string>(() => {
    return clsx(
      'transition-all pl-2 duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]',
      'overflow-hidden whitespace-nowrap',
      this.isExpanded()
        ? 'opacity-100 max-w-[200px] translate-x-0'
        : 'opacity-0 max-w-0 -translate-x-4 pointer-events-none'
    );
  });

  readonly toggleButtonClasses: Signal<string> = computed<string>(() => {
    return clsx(
      'absolute right-3 top-1/2 -translate-y-1/2',
      'flex items-center justify-center rounded-lg p-1.5',
      'transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]',
      'hover:bg-smoke-800 hover:scale-110 active:scale-95',
      'text-smoke-400 hover:text-gold-500',
      'shadow-md hover:shadow-lg hover:shadow-gold-500/10'
    );
  });

  readonly chevronClasses: Signal<string> = computed<string>(() => {
    return clsx(
      'transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]',
      !this.isExpanded() && 'rotate-180'
    );
  });

  constructor() {
    // Save state to localStorage whenever it changes
    effect(() => {
      const expanded = this.isExpanded();
      this.#saveStateToStorage(expanded);
    });
  }

  toggleSidebar(): void {
    this.isExpanded.set(!this.isExpanded());
  }

  #loadStateFromStorage(): boolean {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return true; // Default to expanded for SSR
    }

    try {
      const stored = localStorage.getItem(this.#STORAGE_KEY);
      return stored ? JSON.parse(stored) : true;
    } catch {
      return true; // Default to expanded if error
    }
  }

  #saveStateToStorage(expanded: boolean): void {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return;
    }

    try {
      localStorage.setItem(this.#STORAGE_KEY, JSON.stringify(expanded));
    } catch {
      // Silently fail if localStorage is not available
    }
  }
}