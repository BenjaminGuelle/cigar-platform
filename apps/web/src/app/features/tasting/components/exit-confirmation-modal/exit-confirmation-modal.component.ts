import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '@cigar-platform/shared/ui';

/**
 * Exit Confirmation Modal Component
 * Modal pour confirmer la sortie du rituel en cours
 *
 * ALL STARS Architecture ⭐
 * - Modal centrée avec 2 boutons
 * - Texte rassurant sur l'auto-save
 * - Actions: Quitter / Continuer
 *
 * Usage:
 * ```html
 * <app-exit-confirmation-modal
 *   [isOpen]="showExitModal()"
 *   (confirm)="handleExit()"
 *   (cancel)="showExitModal.set(false)"
 *   (close)="showExitModal.set(false)"
 * />
 * ```
 */
@Component({
  selector: 'app-exit-confirmation-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent],
  template: `
    <ui-modal
      [isOpen]="isOpen()"
      size="sm"
      variant="dialog"
      [showCloseButton]="true"
      (close)="close.emit()"
    >
      <div class="flex flex-col gap-6 p-6">
        <!-- Header -->
        <div class="flex flex-col gap-2 text-center">
          <h2 class="text-2xl font-display text-gold-500 tracking-wide">
            Quitter le Rituel ?
          </h2>
          <p class="text-sm text-smoke-400">
            Votre dégustation sera sauvegardée en brouillon.
          </p>
        </div>

        <!-- Actions -->
        <div class="flex flex-col gap-3">
          <!-- Quitter -->
          <button
            type="button"
            (click)="confirm.emit()"
            class="px-4 py-3 bg-transparent border-2 border-zinc-800 text-smoke-300 font-medium rounded-lg hover:border-gold-500/30 transition-colors"
          >
            Quitter
          </button>

          <!-- Continuer -->
          <button
            type="button"
            (click)="cancel.emit()"
            class="px-4 py-3 bg-gold-500 text-black font-medium rounded-lg hover:bg-gold-400 transition-colors"
          >
            Continuer le Rituel
          </button>
        </div>
      </div>
    </ui-modal>
  `,
})
export class ExitConfirmationModalComponent {
  isOpen = input.required<boolean>();

  confirm = output<void>();
  cancel = output<void>();
  close = output<void>();
}
