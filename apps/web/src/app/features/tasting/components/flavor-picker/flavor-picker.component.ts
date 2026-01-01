import { Component, input, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TASTES, AROMAS } from '@cigar-platform/shared/constants';

/**
 * Flavor Tag with intensity
 */
export interface FlavorTag {
  id: string;
  intensity: 1 | 2 | 3; // Faible / Moyen / Fort
}

/**
 * Flavor Picker Component
 * Allows selecting multiple flavors with intensity levels
 *
 * Used for:
 * - Tastes (goûts) - perceived in mouth
 * - Aromas (arômes) - perceived by nose
 *
 * Intensity levels:
 * 1 = Faible (light)
 * 2 = Moyen (medium)
 * 3 = Fort (strong)
 */
@Component({
  selector: 'app-flavor-picker',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flavor-picker">
      <!-- Header -->
      <div class="picker-header">
        <label>{{ label() }}</label>
        @if (showCount()) {
          <span class="count">{{ selectedCount() }} sélectionné(s)</span>
        }
      </div>

      <!-- Selected Flavors (Tags) -->
      @if (selectedCount() > 0) {
        <div class="selected-flavors">
          @for (flavor of selectedFlavors(); track flavor.id) {
            <div class="flavor-tag">
              <span class="flavor-name">{{ getFlavorLabel(flavor.id) }}</span>
              <div class="intensity-selector">
                @for (level of intensityLevels; track level) {
                  <button
                    type="button"
                    class="intensity-btn"
                    [class.intensity-active]="flavor.intensity >= level"
                    (click)="setIntensity(flavor.id, level)"
                  >
                    <span class="intensity-dot"></span>
                  </button>
                }
              </div>
              <button
                type="button"
                class="remove-btn"
                (click)="removeFlavor(flavor.id)"
              >
                ✕
              </button>
            </div>
          }
        </div>
      }

      <!-- Add Flavor Button -->
      <button
        type="button"
        class="add-btn"
        (click)="togglePicker()"
      >
        {{ pickerOpen() ? '− Fermer' : '+ Ajouter' }}
      </button>

      <!-- Flavor List (when open) -->
      @if (pickerOpen()) {
        <div class="flavor-list">
          @for (flavor of availableFlavors(); track flavor.id) {
            <button
              type="button"
              class="flavor-option"
              (click)="addFlavor(flavor.id)"
            >
              <span class="flavor-label">{{ flavor.label }}</span>
              @if (flavor.description) {
                <span class="flavor-desc">{{ flavor.description }}</span>
              }
            </button>
          }
          @if (availableFlavors().length === 0) {
            <p class="empty-message">Tous les {{ typeLabel() }} ont été sélectionnés</p>
          }
        </div>
      }
    </div>
  `,
  styles: [
    `
      .flavor-picker {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      .picker-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .picker-header label {
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--color-text-primary);
      }

      .count {
        font-size: 0.75rem;
        color: var(--color-text-secondary);
      }

      .selected-flavors {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .flavor-tag {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem;
        background: var(--color-surface);
        border: 1px solid var(--color-border);
        border-radius: 8px;
      }

      .flavor-name {
        flex: 1;
        font-size: 0.875rem;
        color: var(--color-text-primary);
      }

      .intensity-selector {
        display: flex;
        gap: 0.25rem;
      }

      .intensity-btn {
        padding: 0;
        width: 24px;
        height: 24px;
        border: none;
        background: transparent;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .intensity-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--color-border);
        transition: all 0.2s;
      }

      .intensity-btn.intensity-active .intensity-dot {
        background: var(--color-primary);
        transform: scale(1.2);
      }

      .remove-btn {
        width: 24px;
        height: 24px;
        border: none;
        background: transparent;
        color: var(--color-text-tertiary);
        font-size: 1rem;
        cursor: pointer;
        transition: color 0.2s;
      }

      .remove-btn:hover {
        color: var(--color-error);
      }

      .add-btn {
        padding: 0.75rem;
        border: 1px dashed var(--color-border);
        border-radius: 8px;
        background: var(--color-surface);
        color: var(--color-primary);
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
      }

      .add-btn:hover {
        background: var(--color-hover);
      }

      .flavor-list {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        max-height: 300px;
        overflow-y: auto;
        padding: 0.5rem;
        background: var(--color-surface);
        border: 1px solid var(--color-border);
        border-radius: 8px;
      }

      .flavor-option {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 0.25rem;
        padding: 0.75rem;
        border: none;
        background: transparent;
        text-align: left;
        cursor: pointer;
        border-radius: 6px;
        transition: background 0.2s;
      }

      .flavor-option:hover {
        background: var(--color-hover);
      }

      .flavor-label {
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--color-text-primary);
      }

      .flavor-desc {
        font-size: 0.75rem;
        color: var(--color-text-secondary);
      }

      .empty-message {
        padding: 1rem;
        text-align: center;
        font-size: 0.875rem;
        color: var(--color-text-secondary);
        margin: 0;
      }
    `,
  ],
})
export class FlavorPickerComponent {
  // Inputs
  type = input<'tastes' | 'aromas'>('tastes');
  label = input<string>('');
  value = input<FlavorTag[]>([]);
  showCount = input<boolean>(true);

  // Outputs
  valueChange = output<FlavorTag[]>();

  // Internal state
  pickerOpen = signal<boolean>(false);
  intensityLevels = [1, 2, 3] as const;

  // Constants based on type
  private allFlavors = computed(() => {
    return this.type() === 'tastes' ? TASTES : AROMAS;
  });

  // Computed
  selectedFlavors = computed(() => this.value());
  selectedCount = computed(() => this.value().length);

  typeLabel = computed(() => {
    return this.type() === 'tastes' ? 'goûts' : 'arômes';
  });

  availableFlavors = computed(() => {
    const selectedIds = this.value().map((f) => f.id);
    return this.allFlavors().filter((f) => !selectedIds.includes(f.id));
  });

  togglePicker(): void {
    this.pickerOpen.set(!this.pickerOpen());
  }

  addFlavor(id: string): void {
    const newFlavors = [
      ...this.value(),
      { id, intensity: 2 as 1 | 2 | 3 }, // Default: medium
    ];
    this.valueChange.emit(newFlavors);
    this.pickerOpen.set(false);
  }

  removeFlavor(id: string): void {
    const newFlavors = this.value().filter((f) => f.id !== id);
    this.valueChange.emit(newFlavors);
  }

  setIntensity(id: string, intensity: 1 | 2 | 3): void {
    const newFlavors = this.value().map((f) =>
      f.id === id ? { ...f, intensity } : f
    );
    this.valueChange.emit(newFlavors);
  }

  getFlavorLabel(id: string): string {
    const flavor = this.allFlavors().find((f) => f.id === id);
    return flavor?.label ?? id;
  }
}
