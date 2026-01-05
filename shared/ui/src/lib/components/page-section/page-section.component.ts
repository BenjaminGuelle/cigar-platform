import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Page Section Component
 * Modern flat layout component for premium editorial design
 *
 * Features:
 * - Clean flat design (no cards/boxes)
 * - Elegant horizontal separators
 * - Consistent spacing and typography
 * - Premium smoke/gold aesthetic
 *
 * @example
 * ```html
 * <ui-page-section title="Profil">
 *   <!-- Section content -->
 * </ui-page-section>
 *
 * <ui-page-section title="À propos" [bordered]="false">
 *   <!-- Last section without bottom border -->
 * </ui-page-section>
 * ```
 */
@Component({
  selector: 'ui-page-section',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section [class]="this.bordered() ? 'border-b border-smoke-500 pb-10' : ''">
      <div class="mb-8">
        <div class="flex items-baseline gap-4">
          <h2 class="heading-section">{{ title() }}</h2>
          @if (showDivider()) {
            <div class="h-px flex-1 bg-gradient-to-r from-smoke-700 to-transparent"></div>
          }
        </div>
        @if (subtitle()) {
          <p class="mt-1 text-sm text-smoke-400 italic">{{ subtitle() }}</p>
        }
      </div>

      <ng-content />
    </section>
  `,
  styles: [`
    :host {
      display: block;
    }
  `],
})
export class PageSectionComponent {
  title = input.required<string>();
  subtitle = input<string>('');
  showDivider = input<boolean>(true);
  bordered = input<boolean>(true);
}
