import { Component, ChangeDetectionStrategy, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent, ButtonComponent } from '@cigar-platform/shared/ui';

export type ConfirmationVariant = 'destructive' | 'warning' | 'info';

export interface ConfirmationResult {
  confirmed: boolean;
  reason?: string;
}

/**
 * Confirmation Modal Component
 *
 * Reusable modal for confirmation dialogs with optional input field
 *
 * Features:
 * - Customizable title and message
 * - Optional reason input field (for ban/remove actions)
 * - Different variants (danger, warning, info)
 * - Keyboard shortcuts (Escape to cancel, Enter to confirm)
 *
 * @example
 * ```html
 * <app-confirmation-modal
 *   [isOpen]="showConfirm()"
 *   [title]="'Bannir le membre'"
 *   [message]="'Êtes-vous sûr de vouloir bannir cet utilisateur ?'"
 *   [confirmLabel]="'Bannir'"
 *   [showReasonInput]="true"
 *   [variant]="'danger'"
 *   (confirm)="onConfirm($event)"
 *   (cancel)="showConfirm.set(false)"
 * />
 * ```
 */
@Component({
  selector: 'app-confirmation-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, ModalComponent, ButtonComponent],
  templateUrl: './confirmation-modal.component.html',
})
export class ConfirmationModalComponent {
  // Inputs
  readonly isOpen = input<boolean>(false);
  readonly title = input<string>('Confirmation');
  readonly message = input<string>('Êtes-vous sûr de vouloir continuer ?');
  readonly confirmLabel = input<string>('Confirmer');
  readonly cancelLabel = input<string>('Annuler');
  readonly showReasonInput = input<boolean>(false);
  readonly reasonLabel = input<string>('Raison (optionnelle)');
  readonly reasonPlaceholder = input<string>('Entrez une raison...');
  readonly variant = input<ConfirmationVariant>('destructive');
  readonly loading = input<boolean>(false);

  // Outputs
  readonly confirm = output<ConfirmationResult>();
  readonly cancel = output<void>();

  // State
  readonly reason = signal<string>('');

  /**
   * Handle confirmation
   */
  onConfirm(): void {
    this.confirm.emit({
      confirmed: true,
      reason: this.showReasonInput() ? this.reason() : undefined,
    });

    // Reset reason
    this.reason.set('');
  }

  /**
   * Handle cancel
   */
  onCancel(): void {
    this.cancel.emit();

    // Reset reason
    this.reason.set('');
  }

  /**
   * Get button variant based on modal variant
   */
  getConfirmButtonVariant(): 'destructive' | 'primary' | 'secondary' {
    return this.variant() === 'destructive' ? 'destructive' : 'primary';
  }
}
