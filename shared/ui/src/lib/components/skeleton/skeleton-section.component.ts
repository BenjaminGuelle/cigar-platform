import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SkeletonComponent } from './skeleton.component';

/**
 * Section Skeleton
 *
 * Pre-composed skeleton for page sections with title and content.
 *
 * @example
 * <ui-skeleton-section />
 * <ui-skeleton-section contentVariant="stats" />
 */
@Component({
  selector: 'ui-skeleton-section',
  standalone: true,
  imports: [CommonModule, SkeletonComponent],
  template: `
    <div class="space-y-4">
      <!-- Section title -->
      <ui-skeleton size="heading-sm" />

      <!-- Content -->
      @switch (contentVariant()) {
        @case ('text') {
          <div class="space-y-3">
            <ui-skeleton variant="text" width="100%" height="16px" />
            <ui-skeleton variant="text" width="80%" height="16px" />
            <ui-skeleton variant="text" width="60%" height="16px" />
          </div>
        }
        @case ('card') {
          <ui-skeleton size="card" />
        }
        @case ('image') {
          <ui-skeleton size="image-md" />
        }
      }
    </div>
  `,
})
export class SkeletonSectionComponent {
  readonly contentVariant = input<'text' | 'card' | 'image'>('text');
}