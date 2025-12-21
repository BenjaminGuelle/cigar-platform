import {
  Component,
  computed,
  input,
  output,
  booleanAttribute,
  InputSignal,
  InputSignalWithTransform,
  OutputEmitterRef,
  Signal,
} from '@angular/core';
import { IconDirective, type IconName } from '../../directives/icon';
import clsx from 'clsx';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'link'
  | 'destructive';

export type ButtonType = 'button' | 'submit' | 'reset';
export type IconPos = 'left' | 'right' | undefined;

export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

const CLASSES = {
  base: 'inline-flex items-center justify-center gap-2 font-semibold cursor-pointer transition-all duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2 focus-visible:ring-offset-smoke-900 disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.98]',
  variant: {
    primary:
      'bg-gold-500 text-smoke-950 hover:bg-gold-600 hover:shadow-lg hover:shadow-gold-500/20 hover:-translate-y-0.5 shadow-md shadow-gold-500/10 transition-all duration-200',
    secondary: 'bg-smoke-700 text-smoke-50 hover:bg-smoke-600 hover:shadow-md hover:shadow-smoke-950/50 hover:-translate-y-0.5 shadow-sm transition-all duration-200',
    outline:
      'border-2 border-smoke-700 bg-smoke-800 text-smoke-100 hover:border-gold-500 hover:bg-smoke-750 hover:shadow-sm hover:shadow-gold-500/10 transition-all duration-200',
    ghost: 'text-smoke-200 hover:bg-smoke-800 hover:text-smoke-50 hover:shadow-sm transition-all duration-200',
    link: 'text-gold-500 underline-offset-4 hover:underline hover:text-gold-400 transition-colors duration-200',
    destructive:
      'bg-error-600 text-white hover:bg-error-700 hover:shadow-lg hover:shadow-error-500/20 hover:-translate-y-0.5 shadow-md shadow-error-500/10 transition-all duration-200',
  },
  size: {
    sm: 'h-9 px-3 py-1.5 text-sm rounded-md',
    md: 'h-10 px-4 py-2.5 text-base rounded-lg',
    lg: 'h-11 px-6 py-3 text-lg rounded-lg',
    icon: 'h-10 w-10 rounded-full p-2',
  },
};

/**
 * All-star Button Component
 * Premium UX with smooth animations and transitions
 *
 * Features:
 * - Smooth hover effects (lift + shadow)
 * - Active press feedback (scale down)
 * - Loading spinner beside text (keeps context)
 * - Text opacity reduces when loading (70%)
 * - Fade-in/out transitions (200ms ease-in-out)
 * - File-based icons (loaded from public/icons/*.svg)
 *
 * @example
 * <!-- Primary button with smooth animations -->
 * <ui-button variant="primary" (clicked)="save()">
 *   Save Changes
 * </ui-button>
 *
 * @example
 * <!-- Loading state (spinner beside text) -->
 * <ui-button [loading]="isSaving()" [disabled]="isSaving()">
 *   Submit
 * </ui-button>
 *
 * @example
 * <!-- With icon (left by default) -->
 * <ui-button icon="search" variant="outline" fullWidth>
 *   Search
 * </ui-button>
 *
 * @example
 * <!-- Icon on the right -->
 * <ui-button icon="arrow-right" iconPos="right">
 *   Next
 * </ui-button>
 *
 * @example
 * <!-- Icon only with accessibility -->
 * <ui-button size="icon" variant="ghost" icon="x">
 *   <span class="sr-only">Close</span>
 * </ui-button>
 */
@Component({
  selector: 'ui-button',
  standalone: true,
  imports: [IconDirective],
  template: `
    <button [type]="type()" 
            [disabled]="disabled() || loading()" 
            [class]="classes()" 
            [attr.aria-busy]="loading()" 
            [attr.aria-disabled]="disabled()" 
            (click)="handleClick($event)"
    >
      @if (loading()) {
        <i name="spinner"
           class="animate-spin transition-opacity duration-200 ease-in-out"
           [class]="iconSize()"
        ></i>
      }

      @if (!loading() && icon() && iconPos() === 'left') {
        <i [name]="icon()!"
           class="transition-all duration-200 ease-in-out"
           [class]="iconSize()"
        ></i>
      }

      <span class="transition-opacity duration-200 ease-in-out" [class.opacity-70]="loading()">
        <ng-content />
      </span>

      @if (!loading() && icon() && iconPos() === 'right') {
        <i [name]="icon()!"
           class="transition-all duration-200 ease-in-out"
           [class]="iconSize()"
        ></i>
      }
    </button>
  `,
})
export class ButtonComponent {
  variant: InputSignal<ButtonVariant> = input<ButtonVariant>('primary');
  size: InputSignal<ButtonSize> = input<ButtonSize>('md');
  fullWidth: InputSignalWithTransform<boolean, unknown> = input(false, { transform: booleanAttribute });

  disabled: InputSignal<boolean> = input<boolean>(false);
  loading: InputSignal<boolean> = input<boolean>(false);

  type: InputSignal<ButtonType> = input<ButtonType>('button');

  icon: InputSignal<IconName | undefined> = input<IconName>();
  iconPos: InputSignal<IconPos> = input<IconPos>('left');

  clicked: OutputEmitterRef<MouseEvent> = output<MouseEvent>();

  classes: Signal<any> = computed(() => {
    return clsx(
      CLASSES.base,
      CLASSES.variant[this.variant()],
      CLASSES.size[this.size()],
      this.fullWidth() && 'w-full'
    );
  });

  iconSize = computed(() => {
    const sizeMap = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6',
      icon: 'w-5 h-5',
    };
    return sizeMap[this.size()];
  });

  handleClick(event: MouseEvent): void {
    if (!this.disabled() && !this.loading()) {
      this.clicked.emit(event);
    }
  }
}
