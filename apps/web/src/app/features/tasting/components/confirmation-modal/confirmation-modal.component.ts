import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Confirmation Modal Component
 * Displayed after successfully completing a tasting
 *
 * Shows:
 * - Success message
 * - View tasting button
 * - Share button (disabled with "Bientôt" badge for V1)
 * - Close button
 */
@Component({
  selector: 'app-confirmation-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="confirmation-modal">
      <div class="modal-content">
        <!-- Success Icon -->
        <div class="success-icon">
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
            <circle cx="32" cy="32" r="32" fill="var(--color-success-bg)" />
            <path
              d="M20 32L28 40L44 24"
              stroke="var(--color-success)"
              stroke-width="4"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </div>

        <!-- Title & Message -->
        <div class="modal-header">
          <h2>Dégustation terminée !</h2>
          <p>Votre expérience a été enregistrée avec succès.</p>
        </div>

        <!-- Actions -->
        <div class="modal-actions">
          <button class="btn btn-primary" (click)="viewTasting.emit()">
            Voir ma dégustation
          </button>

          <button class="btn btn-share" disabled>
            📤 Partager
            <span class="badge-soon">Bientôt</span>
          </button>

          <button class="btn btn-secondary" (click)="close.emit()">
            Fermer
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .confirmation-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2000;
        padding: 1rem;
      }

      .modal-content {
        background: var(--color-surface);
        border-radius: 16px;
        padding: 2rem;
        max-width: 400px;
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2rem;
      }

      .success-icon {
        animation: scaleIn 0.3s ease-out;
      }

      @keyframes scaleIn {
        from {
          transform: scale(0);
        }
        to {
          transform: scale(1);
        }
      }

      .modal-header {
        text-align: center;
      }

      .modal-header h2 {
        margin: 0 0 0.5rem;
        font-size: 1.5rem;
        font-weight: 600;
        color: var(--color-text-primary);
      }

      .modal-header p {
        margin: 0;
        font-size: 1rem;
        color: var(--color-text-secondary);
      }

      .modal-actions {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        width: 100%;
      }

      .btn {
        padding: 0.875rem 1.5rem;
        border: none;
        border-radius: 8px;
        font-size: 1rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
        position: relative;
      }

      .btn-primary {
        background: var(--color-primary);
        color: white;
      }

      .btn-primary:hover {
        opacity: 0.9;
      }

      .btn-share {
        background: var(--color-surface-secondary);
        color: var(--color-text-tertiary);
        cursor: not-allowed;
        opacity: 0.6;
      }

      .badge-soon {
        position: absolute;
        top: -8px;
        right: -8px;
        padding: 0.25rem 0.5rem;
        background: var(--color-warning);
        color: white;
        font-size: 0.75rem;
        border-radius: 12px;
      }

      .btn-secondary {
        background: transparent;
        color: var(--color-text-secondary);
        border: 1px solid var(--color-border);
      }

      .btn-secondary:hover {
        background: var(--color-hover);
      }
    `,
  ],
})
export class ConfirmationModalComponent {
  // Outputs
  viewTasting = output<void>();
  close = output<void>();
}
