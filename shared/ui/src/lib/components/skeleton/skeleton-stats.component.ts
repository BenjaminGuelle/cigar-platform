import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SkeletonComponent } from './skeleton.component';

/**
 * Stats Grid Skeleton
 *
 * Pre-composed skeleton for stats cards grid.
 * Label + value pattern in cards.
 *
 * @example
 * <ui-skeleton-stats />
 * <ui-skeleton-stats [count]="4" [columns]="2" />
 */
@Component({
  selector: 'ui-skeleton-stats',
  standalone: true,
  imports: [CommonModule, SkeletonComponent],
  template: `
    <div [class]="gridClasses()">
      @for (i of items(); track i) {
        <div class="rounded-lg bg-smoke-800/50 p-4 md:p-6 space-y-3">
          <ui-skeleton size="text-sm" />
          <ui-skeleton size="stat" />
        </div>
      }
    </div>
  `,
})
export class SkeletonStatsComponent {
  readonly count = input<number>(3);
  readonly columns = input<2 | 3 | 4>(3);

  readonly items = (): number[] => {
    return Array.from({ length: this.count() }, (_, i) => i);
  };

  readonly gridClasses = (): string => {
    const cols = this.columns();
    const colClass = cols === 2 ? 'md:grid-cols-2' : cols === 3 ? 'md:grid-cols-3' : 'md:grid-cols-4';
    return `grid grid-cols-2 ${colClass} gap-4 md:gap-6`;
  };
}