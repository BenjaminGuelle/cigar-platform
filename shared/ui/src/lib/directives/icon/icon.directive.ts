import { Directive, input, ElementRef, effect, inject } from '@angular/core';

/**
 * Available icon names from public/icons/*.svg
 * Update this list when adding new icons
 */
export type IconName =
  // Navigation
  | 'arrow-left'
  | 'arrow-right'
  | 'arrow-down'
  | 'chevron-down'
  | 'chevron-left'
  | 'chevron-right'
  | 'chevron-up'
  | 'menu'
  | 'home'
  | 'calendar'
  // Users & Auth
  | 'user'
  | 'users'
  | 'log-in'
  | 'log-out'
  // Brands
  | 'google'
  // Actions
  | 'edit'
  | 'trash'
  | 'save'
  | 'refresh-cw'
  | 'search'
  | 'filter'
  | 'plus'
  | 'minus'
  | 'book-copy'
  // Social
  | 'heart'
  | 'star'
  | 'bookmark'
  // UI
  | 'settings'
  | 'ellipsis-vertical'
  | 'eye'
  | 'eye-off'
  | 'x'
  | 'flame'
  | 'bell'
  | 'lock'
  | 'globe'
  | 'crown'
  | 'clock'
  // Feedback
  | 'spinner'
  | 'check'
  | 'check-circle'
  | 'alert-circle'
  | 'info'
  | 'cloud'
  // Tasting - Pairing
  | 'coffee'
  | 'cup-soda'
  | 'wine'
  | 'beer'
  | 'droplet'
  | 'circle-help'
  // Tasting - Situation
  | 'sun'
  | 'glass-water'
  | 'moon';

/**
 * Icon Directive
 * Loads and renders SVG icons from public/icons folder
 *
 * @example
 * <i name="spinner" class="w-4 h-4 animate-spin"></i>
 * <i name="check" class="w-5 h-5 text-green-500"></i>
 */
@Directive({
  selector: 'i[name]',
  standalone: true,
})
export class IconDirective {
  #el: ElementRef = inject(ElementRef);
  name = input.required<IconName>();

  constructor() {
    effect(() => {
      const iconName = this.name();
      if (iconName) {
        this.#loadIcon(iconName);
      }
    });
  }

  #loadIcon(name: string) {
    fetch(`icons/${name}.svg`)
      .then(response => response.text())
      .then(svg => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(svg, 'image/svg+xml');
        const svgEl = doc.querySelector('svg');

        if (svgEl) {
          svgEl.removeAttribute('width');
          svgEl.removeAttribute('height');

          const existingClasses = this.#el.nativeElement.className;
          svgEl.setAttribute('class', existingClasses || 'w-full h-full');

          this.#el.nativeElement.innerHTML = '';
          this.#el.nativeElement.appendChild(svgEl);
        }
      })
      .catch(() => {
        // Silent fail - icon not found
      });
  }
}
