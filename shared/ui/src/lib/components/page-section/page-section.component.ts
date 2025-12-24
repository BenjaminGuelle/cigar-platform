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
    <section [class]="sectionClasses()">
      <!-- Section Header -->
      <div class="mb-8 flex items-baseline gap-4">
        <h2 class="text-2xl font-semibold text-smoke-50">{{ title() }}</h2>
        @if (showDivider()) {
          <div class="h-px flex-1 bg-gradient-to-r from-smoke-700 to-transparent"></div>
        }
      </div>

      <!-- Section Content -->
      <ng-content />
    </section>
  `,
})
export class PageSectionComponent {
  /**
   * Section title
   */
  title = input.required<string>();

  /**
   * Show horizontal divider after title
   * @default true
   */
  showDivider = input<boolean>(true);

  /**
   * Add bottom border separator between sections
   * @default true
   */
  bordered = input<boolean>(true);

  /**
   * Computed section classes
   */
  readonly sectionClasses = computed(() => {
    const base = 'py-12 first:pt-0';
    const border = this.bordered() ? 'border-b border-smoke-500' : '';

    return `${base} ${border}`.trim();
  });
}
