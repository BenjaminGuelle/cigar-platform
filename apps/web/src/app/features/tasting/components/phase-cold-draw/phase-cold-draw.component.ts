import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FlavorPickerComponent, type FlavorTag } from '../flavor-picker/flavor-picker.component';

/**
 * Phase Cold Draw Component
 * Observation during cold draw (fumage à cru)
 *
 * Captures:
 * - Tastes (with intensity)
 * - Aromas (with intensity)
 * - Notes (optional text)
 */
@Component({
  selector: 'app-phase-cold-draw',
  standalone: true,
  imports: [CommonModule, FormsModule, FlavorPickerComponent],
  template: `
    <div class="phase-cold-draw">
      <div class="phase-header">
        <h2>Fumage à cru</h2>
        <p class="phase-subtitle">Tirage à froid (avant allumage)</p>
      </div>

      <div class="phase-content">
        <!-- Tastes -->
        <app-flavor-picker
          type="tastes"
          label="Goûts perçus en bouche"
          [value]="tastesValue()"
          (valueChange)="handleTastesChange($event)"
        />

        <!-- Aromas -->
        <app-flavor-picker
          type="aromas"
          label="Arômes perçus au nez"
          [value]="aromasValue()"
          (valueChange)="handleAromasChange($event)"
        />

        <!-- Notes -->
        <div class="form-group">
          <label>Notes libres (optionnel)</label>
          <textarea
            [(ngModel)]="notesValue"
            (ngModelChange)="handleNotesChange()"
            placeholder="Vos impressions, remarques..."
            rows="4"
            class="form-control"
          ></textarea>
        </div>
      </div>

      <!-- Actions -->
      <div class="phase-actions">
        <button class="btn btn-secondary" (click)="back.emit()">
          ← Retour
        </button>
        <button class="btn btn-primary" (click)="next.emit()">
          Continuer →
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .phase-cold-draw {
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
        gap: 1.5rem;
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

      .btn-primary {
        background: var(--color-primary);
        color: white;
      }

      .btn-primary:hover {
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
export class PhaseColdDrawComponent {
  // Internal state
  tastesValue = signal<FlavorTag[]>([]);
  aromasValue = signal<FlavorTag[]>([]);
  notesValue = '';

  // Outputs
  back = output<void>();
  next = output<void>();
  dataChange = output<{
    tastes: FlavorTag[];
    aromas: FlavorTag[];
    notes: string;
  }>();

  handleTastesChange(tastes: FlavorTag[]): void {
    this.tastesValue.set(tastes);
    this.emitChange();
  }

  handleAromasChange(aromas: FlavorTag[]): void {
    this.aromasValue.set(aromas);
    this.emitChange();
  }

  handleNotesChange(): void {
    this.emitChange();
  }

  private emitChange(): void {
    this.dataChange.emit({
      tastes: this.tastesValue(),
      aromas: this.aromasValue(),
      notes: this.notesValue,
    });
  }
}
