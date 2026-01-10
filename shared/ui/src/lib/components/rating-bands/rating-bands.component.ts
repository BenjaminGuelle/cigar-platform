import { Component, input, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

export type RatingBandSize = 'sm' | 'md' | 'lg';

/**
 * Rating Bands Component
 * Systeme de notation 0-5 par pas de 0.5 avec bagues de cigare
 *
 * Features:
 * - 5 bagues SVG cliquables (ou readonly pour affichage seul)
 * - Demi-notes via zones gauche/droite
 * - Animation hover + glow
 * - Design premium gold/zinc
 * - Responsive avec sizes (sm/md/lg)
 * - Mode readonly pour affichage seul
 * - Mode compact pour affichage inline
 */
@Component({
  selector: 'ui-rating-bands',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-col items-center" [class.gap-4]="!compact()" [class.gap-2]="compact()">
      <!-- Bagues -->
      <div class="flex items-center" [class]="containerGapClass()">
        @for (band of bands; track band) {
          @if (readonly()) {
            <!-- Mode readonly: simple div sans interactions -->
            <div [class]="readonlyBandClass()">
              <svg
                viewBox="0 0 32 20"
                class="w-full h-full transition-all duration-300"
                [style.filter]="isActive(band) ? 'drop-shadow(0 0 8px rgba(234, 179, 8, 0.6))' : 'none'"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <clipPath [id]="'half-clip-ro-' + band">
                    <rect x="0" y="0" width="16" height="20" />
                  </clipPath>
                </defs>

                <!-- Remplissage -->
                <path
                  d="M2 10.5C2 9.1 3.1 8 4.5 8H12.5C12.5 5.8 14.3 4 16.5 4C18.7 4 20.5 5.8 20.5 8H28.5C29.9 8 31 9.1 31 10.5V11.5C31 12.9 29.9 14 28.5 14H20.5C20.5 16.2 18.7 18 16.5 18C14.3 18 12.5 16.2 12.5 14H4.5C3.1 14 2 12.9 2 11.5V10.5Z"
                  [attr.clip-path]="isHalfFilled(band) ? 'url(#half-clip-ro-' + band + ')' : null"
                  [class.fill-gold-500]="isActive(band) || isHalfFilled(band)"
                  [class.fill-transparent]="!isActive(band) && !isHalfFilled(band)"
                  class="transition-colors duration-300 opacity-30"
                />

                <!-- Contour -->
                <path
                  d="M2 10.5C2 9.1 3.1 8 4.5 8H12.5C12.5 5.8 14.3 4 16.5 4C18.7 4 20.5 5.8 20.5 8H28.5C29.9 8 31 9.1 31 10.5V11.5C31 12.9 29.9 14 28.5 14H20.5C20.5 16.2 18.7 18 16.5 18C14.3 18 12.5 16.2 12.5 14H4.5C3.1 14 2 12.9 2 11.5V10.5Z"
                  [class.stroke-gold-500]="isActive(band) || isHalfFilled(band)"
                  [class.stroke-zinc-800]="!isActive(band) && !isHalfFilled(band)"
                  class="fill-none stroke-[1.5] transition-colors duration-300"
                />
              </svg>
            </div>
          } @else {
            <!-- Mode interactif: button avec hover/click -->
            <button
              type="button"
              [class]="bandSizeClass()"
              (mouseenter)="handleHover(band)"
              (mouseleave)="clearHover()"
              (click)="handleClick($event, band)"
            >
              <svg
                viewBox="0 0 32 20"
                class="w-full h-full transition-all duration-300"
                [style.filter]="(isActive(band) || isHovered(band)) ? 'drop-shadow(0 0 8px rgba(234, 179, 8, 0.6))' : 'none'"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <clipPath [id]="'half-clip-' + band">
                    <rect x="0" y="0" width="16" height="20" />
                  </clipPath>
                </defs>

                <!-- Remplissage -->
                <path
                  d="M2 10.5C2 9.1 3.1 8 4.5 8H12.5C12.5 5.8 14.3 4 16.5 4C18.7 4 20.5 5.8 20.5 8H28.5C29.9 8 31 9.1 31 10.5V11.5C31 12.9 29.9 14 28.5 14H20.5C20.5 16.2 18.7 18 16.5 18C14.3 18 12.5 16.2 12.5 14H4.5C3.1 14 2 12.9 2 11.5V10.5Z"
                  [attr.clip-path]="isHalfFilled(band) ? 'url(#half-clip-' + band + ')' : null"
                  [class.fill-gold-500]="isActive(band) || isHovered(band) || isHalfFilled(band)"
                  [class.fill-transparent]="!isActive(band) && !isHovered(band) && !isHalfFilled(band)"
                  class="transition-colors duration-300 opacity-30"
                />

                <!-- Contour -->
                <path
                  d="M2 10.5C2 9.1 3.1 8 4.5 8H12.5C12.5 5.8 14.3 4 16.5 4C18.7 4 20.5 5.8 20.5 8H28.5C29.9 8 31 9.1 31 10.5V11.5C31 12.9 29.9 14 28.5 14H20.5C20.5 16.2 18.7 18 16.5 18C14.3 18 12.5 16.2 12.5 14H4.5C3.1 14 2 12.9 2 11.5V10.5Z"
                  [class.stroke-gold-500]="isActive(band) || isHovered(band) || isHalfFilled(band)"
                  [class.stroke-zinc-800]="!isActive(band) && !isHovered(band) && !isHalfFilled(band)"
                  class="fill-none stroke-[1.5] transition-colors duration-300"
                />
              </svg>

              <!-- Zones de clic invisibles (gauche/droite pour demi-notes) -->
              <div class="absolute inset-0 flex">
                <div class="w-1/2 h-full" (click)="$event.stopPropagation(); selectHalf(band)"></div>
                <div class="w-1/2 h-full" (click)="$event.stopPropagation(); selectFull(band)"></div>
              </div>
            </button>
          }
        }
      </div>

      <!-- Valeur affichee -->
      @if (!hideValue()) {
        @if (value() > 0) {
          <div
            class="font-display text-gold-500 tracking-wide"
            [class.text-2xl]="!compact()"
            [class.text-lg]="compact()"
          >
            {{ value().toFixed(1) }} / 5
          </div>
        } @else if (!readonly()) {
          <div class="text-sm text-smoke-500 italic">
            Attribuez votre note
          </div>
        }
      }
    </div>
  `,
})
export class RatingBandsComponent {
  // Input/Output
  value = input<number>(0);
  size = input<RatingBandSize>('md');
  valueChange = output<number>();

  /** Mode lecture seule (pas d'interactions) */
  readonly = input<boolean>(false);

  /** Mode compact (plus petit, pour affichage inline) */
  compact = input<boolean>(false);

  /** Masquer la valeur numerique */
  hideValue = input<boolean>(false);

  // State
  readonly hoveredBand = signal<number | null>(null);

  // Constants
  readonly bands = [1, 2, 3, 4, 5];

  // Computed classes for interactive mode
  readonly bandSizeClass = computed(() => {
    const baseClasses = 'relative transition-transform duration-200 hover:scale-110 focus:outline-none';
    if (this.compact()) {
      return `${baseClasses} w-8 h-6`;
    }
    const sizeClasses = {
      sm: 'w-10 h-8',
      md: 'w-16 h-12 md:w-20 md:h-14',
      lg: 'w-24 h-18',
    };
    return `${baseClasses} ${sizeClasses[this.size()]}`;
  });

  // Computed classes for readonly mode
  readonly readonlyBandClass = computed(() => {
    const baseClasses = 'relative transition-transform duration-200';
    if (this.compact()) {
      return `${baseClasses} w-8 h-6`;
    }
    const sizeClasses = {
      sm: 'w-10 h-8',
      md: 'w-16 h-12 md:w-20 md:h-14',
      lg: 'w-24 h-18',
    };
    return `${baseClasses} ${sizeClasses[this.size()]}`;
  });

  readonly containerGapClass = computed(() => {
    if (this.compact()) {
      return 'gap-1.5';
    }
    const gapClasses = {
      sm: 'gap-2',
      md: 'gap-3',
      lg: 'gap-4',
    };
    return gapClasses[this.size()];
  });

  /**
   * Verifie si une bague est active (note >= band)
   */
  isActive(band: number): boolean {
    return this.value() >= band;
  }

  /**
   * Verifie si une bague est survolee (hover >= band)
   */
  isHovered(band: number): boolean {
    if (this.readonly()) return false;
    const hovered = this.hoveredBand();
    return hovered !== null && band <= hovered;
  }

  /**
   * Verifie si une bague doit etre remplie a moitie (demi-note)
   */
  isHalfFilled(band: number): boolean {
    const val = this.value();
    return val >= band - 0.5 && val < band;
  }

  /**
   * Gere le survol d'une bague
   */
  handleHover(band: number): void {
    if (this.readonly()) return;
    this.hoveredBand.set(band);
  }

  /**
   * Annule le survol
   */
  clearHover(): void {
    this.hoveredBand.set(null);
  }

  /**
   * Gere le clic sur une bague
   * La zone gauche/droite est geree par les divs enfants
   */
  handleClick(event: MouseEvent, band: number): void {
    if (this.readonly()) return;
    // Note: Les zones gauche/droite appellent directement selectHalf/selectFull
    // Ce handler est un fallback
    this.selectFull(band);
  }

  /**
   * Selectionne une demi-note (band - 0.5)
   */
  selectHalf(band: number): void {
    if (this.readonly()) return;
    const newValue = band - 0.5;
    this.valueChange.emit(newValue);
    this.triggerHaptic();
  }

  /**
   * Selectionne une note entiere
   */
  selectFull(band: number): void {
    if (this.readonly()) return;
    this.valueChange.emit(band);
    this.triggerHaptic();
  }

  /**
   * Declenche une vibration haptique (mobile)
   */
  private triggerHaptic(): void {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  }
}