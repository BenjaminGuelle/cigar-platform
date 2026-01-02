import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Rating Bands Component
 * Système de notation 0-5 par pas de 0.5 avec bagues de cigare
 *
 * Features:
 * - 5 bagues SVG cliquables
 * - Demi-notes via zones gauche/droite
 * - Animation hover + glow
 * - Design premium gold/zinc
 */
@Component({
  selector: 'ui-rating-bands',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-col items-center gap-4">
      <!-- Bagues -->
      <div class="flex items-center gap-3">
        @for (band of bands; track band) {
          <button
            type="button"
            class="relative w-16 h-12 md:w-20 md:h-14 transition-transform duration-200 hover:scale-110 focus:outline-none"
            (mouseenter)="handleHover(band)"
            (mouseleave)="clearHover()"
            (click)="handleClick($event, band)"
          >
            <!-- SVG Bague -->
            <svg
              viewBox="0 0 32 20"
              class="w-full h-full transition-all duration-300"
              [class.drop-shadow-[0_0_8px_rgba(234,179,8,0.6)]="isActive(band) || isHovered(band)"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M2 10.5C2 9.1 3.1 8 4.5 8H12.5C12.5 5.8 14.3 4 16.5 4C18.7 4 20.5 5.8 20.5 8H28.5C29.9 8 31 9.1 31 10.5V11.5C31 12.9 29.9 14 28.5 14H20.5C20.5 16.2 18.7 18 16.5 18C14.3 18 12.5 16.2 12.5 14H4.5C3.1 14 2 12.9 2 11.5V10.5Z"
                [class.fill-gold-500]="isActive(band) || isHovered(band)"
                [class.fill-zinc-800]="!isActive(band) && !isHovered(band)"
                class="transition-colors duration-300"
              />
            </svg>

            <!-- Zones de clic invisibles (gauche/droite pour demi-notes) -->
            <div class="absolute inset-0 flex">
              <div class="w-1/2 h-full" (click)="$event.stopPropagation(); selectHalf(band)"></div>
              <div class="w-1/2 h-full" (click)="$event.stopPropagation(); selectFull(band)"></div>
            </div>
          </button>
        }
      </div>

      <!-- Valeur affichée -->
      @if (value() > 0) {
        <div class="text-2xl font-display text-gold-500 tracking-wide">
          {{ value().toFixed(1) }} / 5
        </div>
      } @else {
        <div class="text-sm text-smoke-500 italic">
          Attribuez votre note
        </div>
      }
    </div>
  `,
})
export class RatingBandsComponent {
  // Input/Output
  value = input<number>(0);
  valueChange = output<number>();

  // State
  readonly hoveredBand = signal<number | null>(null);

  // Constants
  readonly bands = [1, 2, 3, 4, 5];

  /**
   * Vérifie si une bague est active (note >= band)
   */
  isActive(band: number): boolean {
    return this.value() >= band;
  }

  /**
   * Vérifie si une bague est survolée (hover >= band)
   */
  isHovered(band: number): boolean {
    const hovered = this.hoveredBand();
    return hovered !== null && band <= hovered;
  }

  /**
   * Gère le survol d'une bague
   */
  handleHover(band: number): void {
    this.hoveredBand.set(band);
  }

  /**
   * Annule le survol
   */
  clearHover(): void {
    this.hoveredBand.set(null);
  }

  /**
   * Gère le clic sur une bague
   * La zone gauche/droite est gérée par les divs enfants
   */
  handleClick(event: MouseEvent, band: number): void {
    // Note: Les zones gauche/droite appellent directement selectHalf/selectFull
    // Ce handler est un fallback
    this.selectFull(band);
  }

  /**
   * Sélectionne une demi-note (band - 0.5)
   */
  selectHalf(band: number): void {
    const newValue = band - 0.5;
    this.valueChange.emit(newValue);
    this.triggerHaptic();
  }

  /**
   * Sélectionne une note entière
   */
  selectFull(band: number): void {
    this.valueChange.emit(band);
    this.triggerHaptic();
  }

  /**
   * Déclenche une vibration haptique (mobile)
   */
  private triggerHaptic(): void {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  }
}
