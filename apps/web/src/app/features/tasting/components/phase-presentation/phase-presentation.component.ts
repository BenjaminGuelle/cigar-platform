import { Component, output, signal, input, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CAPE_ASPECTS, CAPE_COLORS, CAPE_TOUCHES } from '@cigar-platform/shared/constants';
import { SingleSelectChipsComponent, type SingleSelectOption } from '../shared/single-select-chips/single-select-chips.component';
import { IconDirective, ButtonComponent } from '@cigar-platform/shared/ui';

/**
 * Phase Présentation Component (Chat-Like)
 * "La Cape Se Dévoile" - Observation visuelle et tactile
 *
 * ALL STARS Architecture ⭐
 * - Chat-like sequential flow (comme Phase Quick)
 * - One question at a time
 * - Header recap progressif
 * - Animations CSS premium
 *
 * Flow:
 * 1. Wrapper Aspect (multi-select)
 * 2. Wrapper Color (single-select, auto-advance)
 * 3. Touch (multi-select)
 * 4. Done (recap + bouton Poursuivre)
 */

type PresentationStep = 'aspect' | 'color' | 'touch' | 'done';

@Component({
  selector: 'app-phase-presentation',
  standalone: true,
  imports: [CommonModule, SingleSelectChipsComponent, IconDirective, ButtonComponent],
  templateUrl: './phase-presentation.component.html',
  styles: [`
    .question-step {
      animation: question-enter 0.25s ease-out;
    }

    @keyframes question-enter {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .header-summary {
      animation: header-update 0.3s ease-out;
    }

    @keyframes header-update {
      from { opacity: 0.7; }
      to { opacity: 1; }
    }
  `],
})
export class PhasePresentationComponent {
  // Constants
  readonly aspects = CAPE_ASPECTS;
  readonly colors = CAPE_COLORS;
  readonly touches = CAPE_TOUCHES;

  // Restoration inputs
  initialAspect = input<string | null | undefined>();
  initialColor = input<string | null | undefined>();
  initialTouch = input<string | null | undefined>();

  // State
  currentStep = signal<PresentationStep>('aspect');
  aspectValue = signal<string | null>(null);
  colorValue = signal<string | null>(null);
  touchValue = signal<string | null>(null);

  // Options pour SingleSelectChips
  readonly aspectOptions = computed<SingleSelectOption[]>(() =>
    this.aspects.map(a => ({ id: a.id, label: a.label }))
  );

  readonly colorOptions = computed<SingleSelectOption[]>(() =>
    this.colors.map(c => ({ id: c.id, label: c.label, description: c.description }))
  );

  readonly touchOptions = computed<SingleSelectOption[]>(() =>
    this.touches.map(t => ({ id: t.id, label: t.label }))
  );

  // Flag to prevent restoration effect from re-triggering
  #hasRestored = false;

  // Outputs
  dataChange = output<{
    wrapperAspect: string | null;
    wrapperColor: string | null;
    touch: string | null;
  }>();
  done = output<void>();

  constructor() {
    effect(() => {
      if (this.#hasRestored) return;

      const aspect = this.initialAspect();
      const color = this.initialColor();
      const touch = this.initialTouch();

      if (!aspect && !color && !touch) return;

      this.#hasRestored = true;

      if (aspect) this.aspectValue.set(aspect);
      if (color) this.colorValue.set(color);
      if (touch) this.touchValue.set(touch);

      if (aspect && color && touch) {
        this.currentStep.set('done');
        this.done.emit();
      } else if (aspect && color) {
        this.currentStep.set('touch');
      } else if (aspect) {
        this.currentStep.set('color');
      }
    });
  }

  /**
   * Handler quand l'aspect est confirmé (après le ring)
   */
  onAspectConfirmed(aspectId: string): void {
    this.aspectValue.set(aspectId);
    this.emitData();
    this.currentStep.set('color');
  }

  /**
   * Handler quand la couleur est confirmée (après le ring)
   */
  onColorConfirmed(colorId: string): void {
    this.colorValue.set(colorId);
    this.emitData();
    this.currentStep.set('touch');
  }

  /**
   * Handler quand le toucher est confirmé (après le ring)
   */
  onTouchConfirmed(touchId: string): void {
    this.touchValue.set(touchId);
    this.emitData();
    this.currentStep.set('done');
    this.done.emit();
  }

  formatAspect(): string {
    return this.aspects.find(a => a.id === this.aspectValue())?.label ?? '';
  }

  formatColor(): string {
    return this.colors.find(c => c.id === this.colorValue())?.label ?? '';
  }

  formatTouch(): string {
    return this.touches.find(t => t.id === this.touchValue())?.label ?? '';
  }

  emitData(): void {
    this.dataChange.emit({
      wrapperAspect: this.aspectValue(),
      wrapperColor: this.colorValue(),
      touch: this.touchValue(),
    });
  }
}
