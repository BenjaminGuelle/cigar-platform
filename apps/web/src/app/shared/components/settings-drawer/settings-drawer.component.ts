import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalComponent, IconDirective } from '@cigar-platform/shared/ui';

/**
 * Settings Drawer Component
 * Slide-over panel from right displaying user settings
 */
@Component({
  selector: 'app-settings-drawer',
  standalone: true,
  imports: [CommonModule, ModalComponent, IconDirective],
  template: `
    <ui-modal
      [isOpen]="isOpen()"
      variant="drawer"
      drawerFrom="right"
      [showCloseButton]="false"
      (close)="close.emit()"
    >
      <div class="flex h-full flex-col">
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-smoke-700 px-5 py-4">
          <h2 class="font-display text-xl font-bold text-smoke-50">Paramètres</h2>
          <button
            type="button"
            (click)="close.emit()"
            class="rounded-full p-2 text-smoke-400 transition-colors hover:bg-smoke-700 hover:text-smoke-200"
            aria-label="Fermer"
          >
            <i name="x" class="h-5 w-5"></i>
          </button>
        </div>

        <!-- Empty State -->
        <div class="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
          <div class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-smoke-800">
            <i name="settings" class="h-8 w-8 text-smoke-500"></i>
          </div>
          <h3 class="mb-2 font-display text-lg font-semibold text-smoke-200">
            Bientôt disponible
          </h3>
          <p class="text-sm text-smoke-400">
            Les paramètres arrivent prochainement.
          </p>
        </div>
      </div>
    </ui-modal>
  `,
})
export class SettingsDrawerComponent {
  readonly isOpen = input<boolean>(false);
  readonly close = output<void>();
}