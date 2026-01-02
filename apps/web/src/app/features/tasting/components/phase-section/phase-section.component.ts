import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Phase Section Component
 * Wrapper uniforme pour toutes les sections de phase du journal de dégustation
 *
 * ALL STARS Architecture ⭐
 * - Garantit la cohérence visuelle entre phases
 * - Assure la détection IntersectionObserver (min-h-screen)
 * - Centralise les styles de section (snap, padding, layout)
 *
 * Features:
 * - Hauteur minimale garantie pour scroll detection
 * - Padding uniforme (pb-32 pour smart bar)
 * - Snap scroll aligné au centre
 * - Layout flex column avec centrage vertical
 * - Container max-width responsive
 *
 * Usage:
 * ```html
 * <app-phase-section phaseId="phase-quick">
 *   <app-phase-quick (dataChange)="..." />
 * </app-phase-section>
 * ```
 */
@Component({
  selector: 'app-phase-section',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section
      [id]="phaseId()"
      class="snap-center scroll-mt-20 min-h-screen flex flex-col justify-center p-6 pb-32"
    >
      <div class="w-full max-w-2xl mx-auto">
        <ng-content />
      </div>
    </section>
  `,
})
export class PhaseSectionComponent {
  /**
   * ID de la section (utilisé par IntersectionObserver)
   * Ex: 'phase-quick', 'phase-finale'
   */
  phaseId = input.required<string>();
}
