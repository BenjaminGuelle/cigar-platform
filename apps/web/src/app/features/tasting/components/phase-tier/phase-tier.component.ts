import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlavorPickerComponent, type FlavorTag } from '../flavor-picker/flavor-picker.component';

/**
 * Phase Tier Component
 * Reusable component for the three tiers (Foin/Divin/Purin)
 *
 * Captures:
 * - Tastes (with intensity)
 * - Aromas (with intensity)
 */
@Component({
  selector: 'app-phase-tier',
  standalone: true,
  imports: [CommonModule, FlavorPickerComponent],
  template: `
    <div class="phase-tier">
      <div class="phase-header">
        <h2>{{ title() }}</h2>
        <p class="phase-subtitle">{{ subtitle() }}</p>
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
      .phase-tier {
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
export class PhaseTierComponent {
  // Inputs
  title = input<string>('');
  subtitle = input<string>('');

  // Internal state
  tastesValue = signal<FlavorTag[]>([]);
  aromasValue = signal<FlavorTag[]>([]);

  // Outputs
  back = output<void>();
  next = output<void>();
  dataChange = output<{
    tastes: FlavorTag[];
    aromas: FlavorTag[];
  }>();

  handleTastesChange(tastes: FlavorTag[]): void {
    this.tastesValue.set(tastes);
    this.emitChange();
  }

  handleAromasChange(aromas: FlavorTag[]): void {
    this.aromasValue.set(aromas);
    this.emitChange();
  }

  private emitChange(): void {
    this.dataChange.emit({
      tastes: this.tastesValue(),
      aromas: this.aromasValue(),
    });
  }
}
