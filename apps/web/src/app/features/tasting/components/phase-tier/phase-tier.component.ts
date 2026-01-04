import { Component, input, output, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlavorPickerComponent, type FlavorTag } from '../flavor-picker/flavor-picker.component';

/**
 * Phase Tier Component
 * Reusable component for the three tiers: Foin / Divin / Purin
 *
 * ALL STARS Architecture ⭐
 * - Tailwind design system (gold/smoke)
 * - Data restoration from observations
 * - Emits changes for auto-save
 * - No navigation buttons (SmartBar handles it)
 * - No header (Timeline handles it)
 *
 * Captures:
 * - Tastes (with intensity 1-3)
 * - Aromas (with intensity 1-3)
 */
@Component({
  selector: 'app-phase-tier',
  standalone: true,
  imports: [CommonModule, FlavorPickerComponent],
  template: `
    <div class="flex flex-col gap-10 px-6 py-8">
      <!-- Subtext -->
      @if (subtext()) {
        <p class="text-center text-xs text-smoke-300 italic">{{ subtext() }}</p>
      }

      <!-- Premium Badge (if disabled) -->
      @if (disabled()) {
        <div class="flex items-center justify-center gap-2 text-xs text-gold-500/60">
          <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd" />
          </svg>
          <span>Accès Premium requis</span>
        </div>
      }

      <!-- Tastes -->
      <div class="flex flex-col gap-4">
        <h3 class="text-center text-xl font-display text-gold-500 tracking-wide">Goûts perçus en bouche</h3>
        <app-flavor-picker
          type="tastes"
          label="Sélectionnez les goûts"
          [value]="tastesValue()"
          [disabled]="disabled()"
          (valueChange)="handleTastesChange($event)"
        />
      </div>

      <!-- Aromas -->
      <div class="flex flex-col gap-4">
        <h3 class="text-center text-xl font-display text-gold-500 tracking-wide">Arômes perçus au nez</h3>
        <app-flavor-picker
          type="aromas"
          label="Sélectionnez les arômes"
          [value]="aromasValue()"
          [disabled]="disabled()"
          (valueChange)="handleAromasChange($event)"
        />
      </div>
    </div>
  `,
})
export class PhaseTierComponent {
  // Inputs
  subtext = input<string>('');
  initialData = input<{
    tastes?: FlavorTag[];
    aromas?: FlavorTag[];
  } | null>();
  disabled = input<boolean>(false);

  // Internal state
  tastesValue = signal<FlavorTag[]>([]);
  aromasValue = signal<FlavorTag[]>([]);

  // Outputs
  dataChange = output<{
    tastes: FlavorTag[];
    aromas: FlavorTag[];
  }>();

  constructor() {
    // Restore data from draft
    effect(() => {
      const initial = this.initialData();
      if (initial) {
        if (initial.tastes) {
          this.tastesValue.set(initial.tastes);
        }
        if (initial.aromas) {
          this.aromasValue.set(initial.aromas);
        }
      }
    });
  }

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
