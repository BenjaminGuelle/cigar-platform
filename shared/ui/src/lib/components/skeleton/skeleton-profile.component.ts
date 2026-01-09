import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SkeletonComponent } from './skeleton.component';

/**
 * Profile Header Skeleton
 *
 * Pre-composed skeleton for profile headers (user/club).
 * Avatar + display name + subtitle pattern.
 *
 * @example
 * <ui-skeleton-profile />
 * <ui-skeleton-profile avatarSize="avatar-md" />
 */
@Component({
  selector: 'ui-skeleton-profile',
  standalone: true,
  imports: [CommonModule, SkeletonComponent],
  template: `
    <div class="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6">
      <ui-skeleton [size]="avatarSize()" />
      <div class="flex flex-col gap-2">
        <ui-skeleton size="heading-md" />
        <ui-skeleton size="text-sm" />
      </div>
    </div>
  `,
})
export class SkeletonProfileComponent {
  readonly avatarSize = input<'avatar-sm' | 'avatar-md' | 'avatar-lg'>('avatar-lg');
}