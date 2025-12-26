import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Search Result Group Component
 *
 * Groups search results by entity type with a header
 * Used in Global Intelligent Search modal
 *
 * Design:
 * - Uppercase group title (subtle smoke-400)
 * - Divider below title
 * - Projected content (results)
 * - Spacing between groups
 *
 * @example
 * ```html
 * <ui-search-result-group title="CLUBS">
 *   <ui-search-result-item ... />
 *   <ui-search-result-item ... />
 * </ui-search-result-group>
 *
 * <ui-search-result-group title="USERS (bientôt)">
 *   <!-- Future content -->
 * </ui-search-result-group>
 * ```
 */

const CLASSES = {
  container: 'space-y-1',
  header: {
    container: 'px-4 py-2 border-b border-smoke-700/30',
    title: 'text-xs font-semibold uppercase tracking-wider text-smoke-400',
  },
  content: 'space-y-0.5',
} as const;

@Component({
  selector: 'ui-search-result-group',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="CLASSES.container" role="group" [attr.aria-label]="title()">
      <!-- Group Header -->
      <div [class]="CLASSES.header.container">
        <h3 [class]="CLASSES.header.title">
          {{ title() }}
        </h3>
      </div>

      <!-- Group Content (projected results) -->
      <div [class]="CLASSES.content" role="listbox">
        <ng-content />
      </div>
    </div>
  `,
})
export class SearchResultGroupComponent {
  // Inputs
  readonly title = input.required<string>();

  // Class constants (expose for template)
  readonly CLASSES = CLASSES;
}
