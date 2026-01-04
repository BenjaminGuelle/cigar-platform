import { Component, input, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TASTES, AROMAS } from '@cigar-platform/shared/constants';
import { IconDirective } from '@cigar-platform/shared/ui';
import type { FlavorTag } from '../../models/tasting-state.model';

// Re-export FlavorTag for components that import it from here
export type { FlavorTag } from '../../models/tasting-state.model';

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
  imports: [CommonModule, IconDirective],
  template: `
    <div class="flex flex-col gap-3">
      <!-- Header -->
      <div class="flex justify-between items-center">
        <label class="text-sm font-medium" [class]="disabled() ? 'text-smoke-500' : 'text-smoke-300'">
          {{ label() }}
        </label>
        @if (showCount()) {
          <span class="text-xs text-smoke-500">{{ selectedCount() }} sélectionné(s)</span>
        }
      </div>

      <!-- Selected Flavors (Tags) -->
      @if (selectedCount() > 0) {
        <div class="flex flex-col gap-2">
          @for (flavor of selectedFlavors(); track flavor.id) {
            <div class="flex items-center gap-3 px-3 py-3 bg-zinc-900 border rounded-lg transition-colors"
                 [class]="disabled() ? 'border-zinc-800 opacity-60' : 'border-zinc-800'">
              <span class="flex-1 text-sm" [class]="disabled() ? 'text-smoke-500' : 'text-smoke-200'">
                {{ getFlavorLabel(flavor.id) }}
              </span>
              <div class="flex gap-1">
                @for (level of intensityLevels; track level) {
                  <button
                    type="button"
                    [disabled]="disabled()"
                    class="w-6 h-6 flex items-center justify-center transition-transform"
                    [class]="disabled() ? 'cursor-not-allowed' : 'cursor-pointer'"
                    (click)="setIntensity(flavor.id, level)"
                  >
                    <span class="w-2 h-2 rounded-full transition-all"
                          [class]="flavor.intensity >= level
                            ? (disabled() ? 'bg-gold-500/40' : 'bg-gold-500 scale-110')
                            : 'bg-zinc-700'">
                    </span>
                  </button>
                }
              </div>
              <button
                type="button"
                [disabled]="disabled()"
                class="w-6 h-6 flex items-center justify-center transition-colors"
                [class]="disabled() ? 'text-smoke-600 cursor-not-allowed' : 'text-smoke-500 hover:text-red-500 cursor-pointer'"
                (click)="removeFlavor(flavor.id)"
              >
                <i name="x" class="w-4 h-4"></i>
              </button>
            </div>
          }
        </div>
      }

      <!-- Add Flavor Button -->
      <button
        type="button"
        [disabled]="disabled()"
        class="px-3 py-3 rounded-lg border border-dashed text-sm font-medium transition-colors"
        [class]="disabled()
          ? 'border-zinc-800 text-smoke-600 cursor-not-allowed bg-zinc-900/50'
          : 'border-zinc-800 text-gold-500 hover:bg-zinc-900 cursor-pointer bg-transparent'"
        (click)="togglePicker()"
      >
        {{ pickerOpen() ? '− Fermer' : '+ Ajouter' }}
      </button>

      <!-- Flavor List (when open) -->
      @if (pickerOpen()) {
        <div class="flex flex-col gap-1 max-h-75 overflow-y-auto p-2 bg-zinc-900 border border-zinc-800 rounded-lg">
          @for (flavor of availableFlavors(); track flavor.id) {
            <button
              type="button"
              class="flex flex-col items-start gap-1 px-3 py-3 text-left rounded-md transition-colors hover:bg-zinc-800"
              (click)="addFlavor(flavor.id)"
            >
              <span class="text-sm font-medium text-smoke-200">{{ flavor.label }}</span>
              @if (flavor.description) {
                <span class="text-xs text-smoke-500">{{ flavor.description }}</span>
              }
            </button>
          }
          @if (availableFlavors().length === 0) {
            <p class="p-4 text-center text-sm text-smoke-500 m-0">
              Tous les {{ typeLabel() }} ont été sélectionnés
            </p>
          }
        </div>
      }
    </div>
  `,
})
export class FlavorPickerComponent {
  // Inputs
  type = input<'tastes' | 'aromas'>('tastes');
  label = input<string>('');
  value = input<FlavorTag[]>([]);
  showCount = input<boolean>(true);
  disabled = input<boolean>(false);

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
