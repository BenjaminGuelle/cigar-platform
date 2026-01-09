import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SkeletonComponent } from './skeleton.component';

/**
 * List Skeleton
 *
 * Pre-composed skeleton for horizontal scroll lists (clubs, avatars).
 *
 * @example
 * <ui-skeleton-list />
 * <ui-skeleton-list [count]="6" variant="avatar" />
 * <ui-skeleton-list [count]="3" variant="card" />
 */
@Component({
  selector: 'ui-skeleton-list',
  standalone: true,
  imports: [CommonModule, SkeletonComponent],
  template: `
    @switch (variant()) {
      @case ('avatar') {
        <div class="flex gap-6 overflow-x-auto py-3">
          @for (i of items(); track i) {
            <ui-skeleton size="avatar-lg" class="flex-shrink-0" />
          }
        </div>
      }
      @case ('card') {
        <div class="space-y-4">
          @for (i of items(); track i) {
            <div class="flex items-center gap-4 p-4 rounded-lg bg-smoke-800/30">
              <ui-skeleton size="avatar-md" />
              <div class="flex-1 space-y-2">
                <ui-skeleton size="text-lg" />
                <ui-skeleton size="text-sm" />
              </div>
            </div>
          }
        </div>
      }
      @case ('text') {
        <div class="space-y-3">
          @for (i of items(); track i) {
            <ui-skeleton size="text-md" [style.width]="getRandomWidth(i)" />
          }
        </div>
      }
    }
  `,
})
export class SkeletonListComponent {
  readonly count = input<number>(4);
  readonly variant = input<'avatar' | 'card' | 'text'>('avatar');

  readonly items = (): number[] => {
    return Array.from({ length: this.count() }, (_, i) => i);
  };

  getRandomWidth(index: number): string {
    const widths = ['100%', '80%', '90%', '70%', '85%'];
    return widths[index % widths.length];
  }
}