import { Component, input, computed } from '@angular/core';
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
 * Phase Presentation Recap Component
 * Carte récap réutilisable pour Phase Présentation (expanded summary)
 *
 * ALL STARS Architecture ⭐
 * - Composant pure presentation
 * - Computed signals pour formatage
 * - Style cohérent avec PhaseQuickRecap
 */
@Component({
  selector: 'app-phase-presentation-recap',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="w-full bg-zinc-900/50 rounded-xl border border-zinc-800 p-4 space-y-4">
      <!-- Wrapper Aspect -->
      @if (wrapperAspect()) {
        <div class="flex flex-col gap-2">
          <span class="text-xs text-smoke-500 uppercase tracking-wide">Apparence</span>
          <span class="text-sm text-gold-500 font-medium">{{ aspectLabel() }}</span>
        </div>
      }

      <!-- Wrapper Color -->
      @if (wrapperColor()) {
        <div class="flex flex-col gap-2 pt-2 border-t border-zinc-800">
          <span class="text-xs text-smoke-500 uppercase tracking-wide">Robe</span>
          <span class="text-sm text-gold-500 font-medium">{{ colorLabel() }}</span>
        </div>
      }

      <!-- Touch -->
      @if (touch()) {
        <div class="flex flex-col gap-2 pt-2 border-t border-zinc-800">
          <span class="text-xs text-smoke-500 uppercase tracking-wide">Toucher</span>
          <span class="text-sm text-gold-500 font-medium">{{ touchLabel() }}</span>
        </div>
      }
    </div>
  `,
})
export class PhasePresentationRecapComponent {
  // Inputs
  wrapperAspect = input<CapeAspect | null>(null);
  wrapperColor = input<CapeColor | null>(null);
  touch = input<CapeTouch | null>(null);

  // Constants
  readonly #aspects = CAPE_ASPECTS;
  readonly #colors = CAPE_COLORS;
  readonly #touches = CAPE_TOUCHES;

  // ==================== Computed ====================

  /**
   * Aspect label
   */
  readonly aspectLabel = computed(() => {
    const aspect = this.wrapperAspect();
    if (!aspect) return null;
    return this.#aspects.find(a => a.id === aspect)?.label ?? null;
  });

  /**
   * Color label
   */
  readonly colorLabel = computed(() => {
    const color = this.wrapperColor();
    if (!color) return null;
    return this.#colors.find(c => c.id === color)?.label ?? null;
  });

  /**
   * Touch label
   */
  readonly touchLabel = computed(() => {
    const touch = this.touch();
    if (!touch) return null;
    return this.#touches.find(t => t.id === touch)?.label ?? null;
  });
}
