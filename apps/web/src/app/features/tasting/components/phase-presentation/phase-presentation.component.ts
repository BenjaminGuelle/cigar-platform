import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  CAPE_ASPECTS,
  CAPE_COLORS,
  CAPE_TOUCHES,
  type CapeAspect,
  type CapeColor,
  type CapeTouch,
} from '@cigar-platform/shared/constants';

/**
 * Phase Presentation Component
 * Observation before lighting the cigar
 *
 * Captures:
 * - Wrapper aspect (multi-select)
 * - Wrapper color (single-select)
 * - Touch (multi-select)
 */
@Component({
  selector: 'app-phase-presentation',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="phase-presentation">
      <div class="phase-header">
        <h2>Présentation</h2>
        <p class="phase-subtitle">Observation visuelle et tactile (avant allumage)</p>
      </div>

      <div class="phase-content">
        <!-- Wrapper Aspect (multi-select) -->
        <div class="form-group">
          <label>Aspect de la cape</label>
          <div class="chip-group">
            @for (aspect of aspects; track aspect.id) {
              <button
                type="button"
                class="chip"
                [class.chip-selected]="isAspectSelected(aspect.id)"
                (click)="toggleAspect(aspect.id)"
              >
                {{ aspect.label }}
              </button>
            }
          </div>
        </div>

        <!-- Wrapper Color (single-select) -->
        <div class="form-group">
          <label>Couleur de la cape</label>
          <div class="color-grid">
            @for (color of colors; track color.id) {
              <button
                type="button"
                class="color-option"
                [class.color-selected]="colorValue() === color.id"
                (click)="selectColor(color.id)"
              >
                <span class="color-label">{{ color.label }}</span>
                <span class="color-desc">{{ color.description }}</span>
              </button>
            }
          </div>
        </div>

        <!-- Touch (multi-select) -->
        <div class="form-group">
          <label>Toucher</label>
          <div class="chip-group">
            @for (touch of touches; track touch.id) {
              <button
                type="button"
                class="chip"
                [class.chip-selected]="isTouchSelected(touch.id)"
                (click)="toggleTouch(touch.id)"
              >
                {{ touch.label }}
              </button>
            }
          </div>
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
      .phase-presentation {
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
        gap: 0.75rem;
      }

      .form-group label {
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--color-text-primary);
      }

      .chip-group {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
      }

      .chip {
        padding: 0.5rem 1rem;
        border: 1px solid var(--color-border);
        border-radius: 20px;
        background: var(--color-surface);
        color: var(--color-text-primary);
        font-size: 0.875rem;
        cursor: pointer;
        transition: all 0.2s;
      }

      .chip:hover {
        background: var(--color-hover);
      }

      .chip-selected {
        background: var(--color-primary);
        color: white;
        border-color: var(--color-primary);
      }

      .color-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
        gap: 0.5rem;
      }

      .color-option {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 0.25rem;
        padding: 0.75rem;
        border: 2px solid var(--color-border);
        border-radius: 8px;
        background: var(--color-surface);
        text-align: left;
        cursor: pointer;
        transition: all 0.2s;
      }

      .color-option:hover {
        background: var(--color-hover);
      }

      .color-selected {
        border-color: var(--color-primary);
        background: var(--color-primary-bg);
      }

      .color-label {
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--color-text-primary);
      }

      .color-desc {
        font-size: 0.75rem;
        color: var(--color-text-secondary);
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
export class PhasePresentationComponent {
  // Constants
  aspects = CAPE_ASPECTS;
  colors = CAPE_COLORS;
  touches = CAPE_TOUCHES;

  // Internal state
  aspectsValue = signal<CapeAspect[]>([]);
  colorValue = signal<CapeColor | null>(null);
  touchesValue = signal<CapeTouch[]>([]);

  // Outputs
  back = output<void>();
  next = output<void>();
  dataChange = output<{
    wrapperAspect: CapeAspect[];
    wrapperColor: CapeColor | null;
    touch: CapeTouch[];
  }>();

  isAspectSelected(id: CapeAspect): boolean {
    return this.aspectsValue().includes(id);
  }

  toggleAspect(id: CapeAspect): void {
    const current = this.aspectsValue();
    const newValue = current.includes(id)
      ? current.filter((a) => a !== id)
      : [...current, id];
    this.aspectsValue.set(newValue);
    this.emitChange();
  }

  selectColor(id: CapeColor): void {
    this.colorValue.set(id);
    this.emitChange();
  }

  isTouchSelected(id: CapeTouch): boolean {
    return this.touchesValue().includes(id);
  }

  toggleTouch(id: CapeTouch): void {
    const current = this.touchesValue();
    const newValue = current.includes(id)
      ? current.filter((t) => t !== id)
      : [...current, id];
    this.touchesValue.set(newValue);
    this.emitChange();
  }

  private emitChange(): void {
    this.dataChange.emit({
      wrapperAspect: this.aspectsValue(),
      wrapperColor: this.colorValue(),
      touch: this.touchesValue(),
    });
  }
}
