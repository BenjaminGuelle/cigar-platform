import {
  Component,
  input,
  computed,
  effect,
  signal,
  WritableSignal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import clsx from 'clsx';

export type SwitchSize = 'sm' | 'md' | 'lg';

const CLASSES = {
  container: {
    base: 'flex items-start gap-3',
    position: {
      left: '',
      right: 'flex-row-reverse justify-between',
    },
  },
  wrapper: 'relative inline-flex items-center cursor-pointer',
  // Hidden native input (sr-only)
  input: 'sr-only peer',
  // Switch track (background)
  track: {
    base: 'relative rounded-full transition-all duration-200',
    size: {
      sm: 'w-8 h-5',
      md: 'w-11 h-6',
      lg: 'w-14 h-7',
    },
    state: {
      enabled: {
        on: 'bg-gold-600',
        off: 'bg-smoke-800 border-2 border-smoke-500',
      },
      disabled: 'bg-smoke-800 cursor-not-allowed opacity-50',
      focus: 'peer-focus:ring-2 peer-focus:ring-gold-500/20 peer-focus:ring-offset-2 peer-focus:ring-offset-smoke-900',
    },
  },
  // Switch thumb (circle that slides)
  thumb: {
    base: 'absolute top-1/2 -translate-y-1/2 bg-white rounded-full transition-all duration-200 shadow-md',
    size: {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6',
    },
    position: {
      sm: { on: 'translate-x-3.5', off: 'translate-x-0.5' },
      md: { on: 'translate-x-5', off: 'translate-x-0.5' },
      lg: { on: 'translate-x-7', off: 'translate-x-0.5' },
    },
  },
  label: {
    base: 'cursor-pointer flex-1',
    size: {
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg',
    },
    title: 'font-medium text-smoke-100',
    description: 'text-xs text-smoke-200 mt-0.5',
  },
};

let switchIdCounter: number = 0;

/**
 * Switch component - Toggle switch with label and description
 *
 * Architecture:
 * - Standalone component
 * - FormControl integration for reactive forms
 * - Signals for reactivity
 * - clsx for class composition
 * - Accessibility (ARIA, keyboard support)
 *
 * @example
 * ```html
 * <ui-switch
 *   switchId="share-public"
 *   label="Partager mes dégustations"
 *   description="Rendre mes évaluations visibles publiquement"
 *   [control]="shareEvaluationsControl"
 * />
 * ```
 */
@Component({
  selector: 'ui-switch',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  host: {
    class: 'block',
  },
  template: `
    <div [class]="containerClasses()">
      <!-- Switch wrapper -->
      <label [class]="CLASSES.wrapper">
        <!-- Hidden native input -->
        <input
          [id]="switchId()"
          type="checkbox"
          role="switch"
          [checked]="internalValue()"
          (change)="onToggle($event)"
          [disabled]="control().disabled"
          [class]="CLASSES.input"
          [attr.aria-labelledby]="label() ? switchId() + '-label' : null"
          [attr.aria-describedby]="description() ? switchId() + '-desc' : null"
          [attr.aria-checked]="internalValue()"
        />
        <!-- Switch track (background) -->
        <span [class]="trackClasses()">
          <!-- Switch thumb (sliding circle) -->
          <span [class]="thumbClasses()"></span>
        </span>
      </label>

      <!-- Label & Description -->
      @if (label() || description()) {
        <div [class]="CLASSES.label.base">
          @if (label()) {
            <label
              [id]="switchId() + '-label'"
              [for]="switchId()"
              [class]="labelClasses()"
            >
              {{ label() }}
            </label>
          }
          @if (description()) {
            <p
              [id]="switchId() + '-desc'"
              [class]="CLASSES.label.description"
            >
              {{ description() }}
            </p>
          }
        </div>
      }
    </div>
  `,
})
export class SwitchComponent {
  readonly switchId = input<string>(`switch-${++switchIdCounter}`);
  readonly size = input<SwitchSize>('md');
  readonly switchPosition = input<'left' | 'right'>('left');
  readonly label = input<string>('');
  readonly description = input<string>('');
  readonly control = input.required<FormControl<boolean>>();

  readonly #internalValue: WritableSignal<boolean> = signal<boolean>(false);

  readonly CLASSES = CLASSES;

  readonly internalValue = computed<boolean>(() => this.#internalValue());

  readonly containerClasses = computed<string>(() =>
    clsx(
      CLASSES.container.base,
      CLASSES.container.position[this.switchPosition()]
    )
  );

  readonly trackClasses = computed<string>(() => {
    const ctrl = this.control();
    const isChecked = this.#internalValue();

    return clsx(
      CLASSES.track.base,
      CLASSES.track.size[this.size()],
      ctrl?.disabled
        ? CLASSES.track.state.disabled
        : [
            isChecked ? CLASSES.track.state.enabled.on : CLASSES.track.state.enabled.off,
            CLASSES.track.state.focus,
          ]
    );
  });

  readonly thumbClasses = computed<string>(() => {
    const isChecked = this.#internalValue();
    const sizeKey = this.size();

    return clsx(
      CLASSES.thumb.base,
      CLASSES.thumb.size[sizeKey],
      isChecked
        ? CLASSES.thumb.position[sizeKey].on
        : CLASSES.thumb.position[sizeKey].off
    );
  });

  readonly labelClasses = computed<string>(() =>
    clsx(
      CLASSES.label.size[this.size()],
      CLASSES.label.title
    )
  );

  onToggle(event: Event): void {
    if (this.control().disabled) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    const target = event.target as HTMLInputElement;
    const newValue = target.checked;

    // Update internal signal for reactivity
    this.#internalValue.set(newValue);

    // Update FormControl
    this.control().setValue(newValue);
    this.control().markAsTouched();
  }

  constructor() {
    // Sync internal value with FormControl (reactive to value changes)
    effect((onCleanup) => {
      const ctrl = this.control();

      // Set initial value
      this.#internalValue.set(ctrl.value ?? false);

      // Subscribe to value changes (for external updates like patchValue)
      const subscription = ctrl.valueChanges.subscribe(() => {
        this.#internalValue.set(ctrl.value ?? false);
      });

      onCleanup(() => subscription.unsubscribe());
    });
  }
}
