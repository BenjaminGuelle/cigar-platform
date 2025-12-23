import { Component, input, computed, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import clsx from 'clsx';

export type SkeletonVariant = 'text' | 'circular' | 'rectangular' | 'rounded';
export type SkeletonAnimation = 'pulse' | 'wave' | 'none';

/**
 * Skeleton Component
 * Displays loading placeholder with shimmer effect
 * Used for content loading states
 */
@Component({
  selector: 'ui-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="skeletonClasses()" [style.width]="width()" [style.height]="height()">
      @if (animation() === 'wave') {
        <div class="skeleton-wave"></div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    .skeleton-base {
      background: linear-gradient(90deg, #262626 0%, #303030 50%, #262626 100%);
      background-size: 200% 100%;
      position: relative;
      overflow: hidden;
    }

    .skeleton-pulse {
      animation: skeleton-pulse 1.5s ease-in-out infinite;
    }

    @keyframes skeleton-pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.4;
      }
    }

    .skeleton-wave-container {
      animation: skeleton-wave 1.5s linear infinite;
    }

    @keyframes skeleton-wave {
      0% {
        background-position: -200% 0;
      }
      100% {
        background-position: 200% 0;
      }
    }

    .skeleton-wave {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(
        90deg,
        transparent 0%,
        rgba(212, 175, 55, 0.08) 50%,
        transparent 100%
      );
      animation: wave-animation 1.5s ease-in-out infinite;
    }

    @keyframes wave-animation {
      0% {
        transform: translateX(-100%);
      }
      100% {
        transform: translateX(100%);
      }
    }

    .skeleton-text {
      border-radius: 4px;
      height: 1em;
    }

    .skeleton-circular {
      border-radius: 50%;
    }

    .skeleton-rectangular {
      border-radius: 0;
    }

    .skeleton-rounded {
      border-radius: 8px;
    }
  `],
})
export class SkeletonComponent {
  readonly variant = input<SkeletonVariant>('rectangular');
  readonly animation = input<SkeletonAnimation>('wave');
  readonly width = input<string>('100%');
  readonly height = input<string>('20px');

  readonly skeletonClasses: Signal<string> = computed<string>(() => {
    return clsx(
      'skeleton-base',
      {
        'skeleton-pulse': this.animation() === 'pulse',
        'skeleton-wave-container': this.animation() === 'wave',
        'skeleton-text': this.variant() === 'text',
        'skeleton-circular': this.variant() === 'circular',
        'skeleton-rectangular': this.variant() === 'rectangular',
        'skeleton-rounded': this.variant() === 'rounded',
      }
    );
  });
}