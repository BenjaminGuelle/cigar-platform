import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Page Header Component
 * Premium editorial page header with display font and gold accents
 *
 * Features:
 * - Large display title with Parisienne font (or regular)
 * - Optional subtitle/description
 * - Gold bottom border with gradient
 * - Spacious layout for premium feel
 *
 * @example
 * ```html
 * <ui-page-header
 *   title="Paramètres"
 *   description="Gérez votre profil et vos préférences"
 * />
 *
 * <ui-page-header
 *   title="Mon Club"
 *   description="Gérez votre club de dégustation"
 *   [useDisplayFont]="true"
 * />
 * ```
 */
@Component({
  selector: 'ui-page-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="border-b border-smoke-700/40 pb-8">
      <h1 [class]="titleClasses()">{{ title() }}</h1>
      @if (description()) {
        <p class="body mt-3">{{ description() }}</p>
      }
    </header>
  `,
  styles: [`
    :host {
      display: block;
    }
  `],
})
export class PageHeaderComponent {
  /**
   * Page title
   */
  title = input.required<string>();

  /**
   * Optional description/subtitle
   */
  description = input<string>();

  /**
   * Use display font (Parisienne) for title
   * @default false
   */
  useDisplayFont = input<boolean>(false);

  /**
   * Title size
   * @default 'xl'
   */
  size = input<'lg' | 'xl' | '2xl'>('xl');

  /**
   * Computed title classes
   */
  readonly titleClasses = computed(() => {
    if (this.useDisplayFont()) {
      return 'heading-display';
    }

    switch (this.size()) {
      case 'lg':
        return 'heading-2';
      case 'xl':
        return 'heading-1';
      case '2xl':
        return 'heading-display';
      default:
        return 'heading-1';
    }
  });
}
