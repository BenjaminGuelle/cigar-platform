import { Component, input, computed, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import clsx from 'clsx';

export type LogoVariant = 'full' | 'compact';
export type LogoSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'ui-logo',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (variant() === 'full') {
      <!-- Full Logo: Text + Tagline -->
      <div [class]="containerClasses()">
        <h1 [class]="titleClasses()">
          Cigar & Club
        </h1>
        @if (showTagline()) {
          <p class="text-xs text-smoke-300 tracking-widest uppercase font-light">
            A Brotherhood of Connoisseurs
          </p>
        }
      </div>
    } @else {
      <!-- Compact Logo: C&C in Circle -->
      <div [class]="compactContainerClasses()">
        <span [class]="compactTextClasses()">C&C</span>
      </div>
    }
  `,
})
export class LogoComponent {
  readonly variant = input<LogoVariant>('full');
  readonly size = input<LogoSize>('md');
  readonly showTagline = input<boolean>(true);

  readonly containerClasses: Signal<string> = computed<string>(() => {
    return clsx(
      'text-center',
      this.size() === 'sm' && 'space-y-0.5',
      this.size() === 'md' && 'space-y-1',
      this.size() === 'lg' && 'space-y-2'
    );
  });

  readonly titleClasses: Signal<string> = computed<string>(() => {
    const sizeMap = {
      sm: 'text-2xl',
      md: 'text-3xl',
      lg: 'text-5xl',
    };

    return clsx(
      'font-display text-smoke-50 tracking-wide',
      sizeMap[this.size()]
    );
  });

  readonly compactContainerClasses: Signal<string> = computed<string>(() => {
    const sizeMap = {
      sm: 'h-8 w-8',
      md: 'h-10 w-10',
      lg: 'h-14 w-14',
    };

    return clsx(
      'flex items-center justify-center rounded-full border-2 border-smoke-50 bg-transparent',
      sizeMap[this.size()]
    );
  });

  readonly compactTextClasses: Signal<string> = computed<string>(() => {
    const sizeMap = {
      sm: 'text-xs',
      md: 'text-sm',
      lg: 'text-lg',
    };

    return clsx(
      'font-display text-smoke-50 tracking-tight font-semibold',
      sizeMap[this.size()]
    );
  });
}