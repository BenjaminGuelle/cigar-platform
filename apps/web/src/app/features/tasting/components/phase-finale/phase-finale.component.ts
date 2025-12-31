import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RatingBaguesComponent } from '../rating-bagues/rating-bagues.component';

/**
 * Phase Finale Component
 * Final phase of the tasting (both Quick and Premium)
 *
 * Captures:
 * - Rating (0.5-5, required)
 * - Comment (optional)
 */
@Component({
  selector: 'app-phase-finale',
  standalone: true,
  imports: [CommonModule, FormsModule, RatingBaguesComponent],
  template: `
    <div class="phase-finale">
      <div class="phase-header">
        <h2>Votre verdict</h2>
        <p class="phase-subtitle">Notez votre expérience</p>
      </div>

      <div class="phase-content">
        <!-- Rating -->
        <div class="form-group">
          <app-rating-bagues
            [value]="ratingValue()"
            (valueChange)="handleRatingChange($event)"
            [label]="'Note globale'"
          />
          @if (ratingValue() === 0) {
            <p class="help-text">La note est obligatoire pour terminer</p>
          }
        </div>

        <!-- Comment -->
        <div class="form-group">
          <label>Commentaire (optionnel)</label>
          <textarea
            [(ngModel)]="commentValue"
            (ngModelChange)="handleCommentChange()"
            placeholder="Partagez vos impressions, votre ressenti sur ce cigare..."
            rows="6"
            class="form-control"
          ></textarea>
          <p class="char-count">{{ commentValue.length }} / 1000</p>
        </div>
      </div>

      <!-- Actions -->
      <div class="phase-actions">
        <button class="btn btn-secondary" (click)="back.emit()">
          ← Retour
        </button>
        <button
          class="btn btn-primary"
          [disabled]="ratingValue() === 0"
          (click)="complete.emit()"
        >
          Terminer la dégustation
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .phase-finale {
        display: flex;
        flex-direction: column;
        gap: 2rem;
      }

      .phase-header {
        text-align: center;
      }

      .phase-header h2 {
        margin: 0 0 0.5rem;
        font-size: 1.5rem;
        font-weight: 600;
        color: var(--color-text-primary);
      }

      .phase-subtitle {
        margin: 0;
        font-size: 0.875rem;
        color: var(--color-text-secondary);
      }

      .phase-content {
        display: flex;
        flex-direction: column;
        gap: 2rem;
      }

      .form-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .form-group label {
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--color-text-primary);
      }

      .form-control {
        padding: 0.75rem;
        border: 1px solid var(--color-border);
        border-radius: 8px;
        font-size: 1rem;
        font-family: inherit;
        background: var(--color-surface);
        color: var(--color-text-primary);
        resize: vertical;
      }

      .form-control:focus {
        outline: none;
        border-color: var(--color-primary);
      }

      .help-text {
        margin: 0;
        font-size: 0.875rem;
        color: var(--color-error);
      }

      .char-count {
        margin: 0;
        font-size: 0.75rem;
        color: var(--color-text-tertiary);
        text-align: right;
      }

      .phase-actions {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        padding-top: 1rem;
        border-top: 1px solid var(--color-border);
      }

      .btn {
        padding: 0.75rem 2rem;
        border: none;
        border-radius: 8px;
        font-size: 1rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
      }

      .btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .btn-primary {
        background: var(--color-primary);
        color: white;
      }

      .btn-primary:hover:not(:disabled) {
        opacity: 0.9;
      }

      .btn-secondary {
        background: transparent;
        color: var(--color-text-primary);
        border: 1px solid var(--color-border);
      }

      .btn-secondary:hover {
        background: var(--color-hover);
      }
    `,
  ],
})
export class PhaseFinaleComponent {
  // Internal state
  commentValue = '';
  ratingValue = signal<number>(0);

  // Outputs
  back = output<void>();
  complete = output<void>();
  dataChange = output<{
    rating: number;
    comment: string;
  }>();

  handleRatingChange(rating: number): void {
    this.ratingValue.set(rating);
    this.emitChange();
  }

  handleCommentChange(): void {
    // Limit to 1000 characters
    if (this.commentValue.length > 1000) {
      this.commentValue = this.commentValue.substring(0, 1000);
    }
    this.emitChange();
  }

  private emitChange(): void {
    this.dataChange.emit({
      rating: this.ratingValue(),
      comment: this.commentValue,
    });
  }
}
