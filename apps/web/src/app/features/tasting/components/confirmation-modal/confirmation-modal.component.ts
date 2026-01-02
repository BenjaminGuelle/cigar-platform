import { Component, output } from '@angular/core';
import { ModalComponent, ButtonComponent, IconDirective } from '@cigar-platform/shared/ui';

/**
 * Confirmation Modal Component
 * Displayed after successfully completing a tasting
 *
 * Shows:
 * - Success message with gold theme
 * - View tasting button
 * - Share button (coming soon)
 * - Close button
 */
@Component({
  selector: 'app-confirmation-modal',
  standalone: true,
  imports: [ModalComponent, ButtonComponent, IconDirective],
  template: `
    <ui-modal
      [isOpen]="true"
      variant="dialog"
      size="sm"
      desktopPosition="centered"
      [showCloseButton]="false"
      (close)="close.emit()"
    >
      <!-- Success Icon -->
      <div class="flex justify-center mb-6">
        <div class="relative">
          <!-- Circle background with pulse animation -->
          <div class="absolute inset-0 rounded-full bg-gold-500/20 animate-ping"></div>
          <div class="relative w-20 h-20 rounded-full bg-gold-500/10 flex items-center justify-center border-2 border-gold-500">
            <i name="check" class="w-10 h-10 text-gold-500"></i>
          </div>
        </div>
      </div>

      <!-- Title & Message -->
      <div class="text-center mb-8">
        <h2 class="text-2xl font-display text-gold-500 mb-3">
          Rituel Scellé
        </h2>
        <p class="text-smoke-200 leading-relaxed">
          Votre dégustation a été immortalisée avec succès.
        </p>
      </div>

      <!-- Actions -->
      <div class="flex flex-col gap-3">
        <ui-button
          variant="primary"
          [fullWidth]="true"
          (clicked)="viewTasting.emit()"
        >
          Voir ma dégustation
        </ui-button>

        <!-- Share button (coming soon) -->
        <ui-button
          variant="outline"
          [fullWidth]="true"
          [disabled]="true"
        >
          <span class="flex items-center justify-center gap-2">
            <span>Partager</span>
            <span class="text-xs text-gold-500 font-semibold">(Bientôt)</span>
          </span>
        </ui-button>

        <ui-button
          variant="ghost"
          [fullWidth]="true"
          (clicked)="close.emit()"
        >
          Fermer
        </ui-button>
      </div>
    </ui-modal>
  `,
})
export class ConfirmationModalComponent {
  // Outputs
  viewTasting = output<void>();
  close = output<void>();
}
