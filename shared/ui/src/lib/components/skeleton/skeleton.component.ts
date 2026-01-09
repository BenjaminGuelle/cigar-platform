import { Component, input, computed, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export type SkeletonVariant = 'text' | 'circular' | 'rectangular' | 'rounded';
export type SkeletonAnimation = 'pulse' | 'none';

/**
 * Preset sizes for common skeleton patterns
 * Following Linear/Stripe minimalist approach
 */
export type SkeletonSize =
  | 'avatar-sm'   // 32x32 circular
  | 'avatar-md'   // 48x48 circular
  | 'avatar-lg'   // 80x80 circular
  | 'text-xs'     // 12px height, 60px width
  | 'text-sm'     // 14px height, 80px width
  | 'text-md'     // 16px height, 120px width
  | 'text-lg'     // 20px height, 160px width
  | 'text-xl'     // 24px height, 200px width
  | 'heading-sm'  // 24px height, 140px width
  | 'heading-md'  // 32px height, 180px width
  | 'heading-lg'  // 40px height, 240px width
  | 'button'      // 40px height, 100px width
  | 'card'        // 100% width, 120px height
  | 'image-sm'    // 100% width, 120px height
  | 'image-md'    // 100% width, 192px height
  | 'image-lg'    // 100% width, 256px height
  | 'stat'        // 60px width, 32px height (for stat numbers)
  | 'badge'       // 80px width, 28px height
  | 'custom';     // Use width/height inputs

const SIZE_MAP: Record<Exclude<SkeletonSize, 'custom'>, { width: string; height: string; variant: SkeletonVariant }> = {
  'avatar-sm': { width: '32px', height: '32px', variant: 'circular' },
  'avatar-md': { width: '48px', height: '48px', variant: 'circular' },
  'avatar-lg': { width: '80px', height: '80px', variant: 'circular' },
  'text-xs': { width: '60px', height: '12px', variant: 'text' },
  'text-sm': { width: '80px', height: '14px', variant: 'text' },
  'text-md': { width: '120px', height: '16px', variant: 'text' },
  'text-lg': { width: '160px', height: '20px', variant: 'text' },
  'text-xl': { width: '200px', height: '24px', variant: 'text' },
  'heading-sm': { width: '140px', height: '24px', variant: 'rounded' },
  'heading-md': { width: '180px', height: '32px', variant: 'rounded' },
  'heading-lg': { width: '240px', height: '40px', variant: 'rounded' },
  'button': { width: '100px', height: '40px', variant: 'rounded' },
  'card': { width: '100%', height: '120px', variant: 'rounded' },
  'image-sm': { width: '100%', height: '120px', variant: 'rounded' },
  'image-md': { width: '100%', height: '192px', variant: 'rounded' },
  'image-lg': { width: '100%', height: '256px', variant: 'rounded' },
  'stat': { width: '60px', height: '32px', variant: 'rounded' },
  'badge': { width: '80px', height: '28px', variant: 'rounded' },
};

/**
 * Skeleton Component - Minimalist Design
 *
 * Displays loading placeholder with subtle pulse animation.
 * Following Linear/Stripe approach: monochrome, no gradients, simple shapes.
 *
 * @example
 * // Using preset sizes (recommended)
 * <ui-skeleton size="avatar-lg" />
 * <ui-skeleton size="text-md" />
 * <ui-skeleton size="heading-lg" />
 *
 * @example
 * // Custom size (legacy support)
 * <ui-skeleton variant="rounded" width="100%" height="200px" />
 */
@Component({
  selector: 'ui-skeleton',
  standalone: true,
  imports: [CommonModule],
  host: { class: 'block' },
  template: `
    <div
      class="bg-smoke-600"
      [class.animate-pulse]="animation() === 'pulse'"
      [class.rounded]="computedVariant() === 'text'"
      [class.rounded-full]="computedVariant() === 'circular'"
      [class.rounded-lg]="computedVariant() === 'rounded'"
      [style.width]="computedWidth()"
      [style.height]="computedHeight()"
      aria-hidden="true"
    ></div>
  `,
})
export class SkeletonComponent {
  /** Preset size - recommended approach */
  readonly size = input<SkeletonSize>('custom');

  /** Shape variant (auto-set when using preset size) */
  readonly variant = input<SkeletonVariant>('rectangular');

  /** Animation type - pulse is default (minimalist) */
  readonly animation = input<SkeletonAnimation>('pulse');

  /** Custom width - only used when size='custom' */
  readonly width = input<string>('100%');

  /** Custom height - only used when size='custom' */
  readonly height = input<string>('20px');

  readonly computedWidth: Signal<string> = computed(() => {
    const size = this.size();
    if (size !== 'custom' && SIZE_MAP[size]) {
      return SIZE_MAP[size].width;
    }
    return this.width();
  });

  readonly computedHeight: Signal<string> = computed(() => {
    const size = this.size();
    if (size !== 'custom' && SIZE_MAP[size]) {
      return SIZE_MAP[size].height;
    }
    return this.height();
  });

  readonly computedVariant: Signal<SkeletonVariant> = computed(() => {
    const size = this.size();
    if (size !== 'custom' && SIZE_MAP[size]) {
      return SIZE_MAP[size].variant;
    }
    return this.variant();
  });
}