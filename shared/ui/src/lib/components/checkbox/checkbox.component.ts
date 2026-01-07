import {
  Component,
  input,
  computed,
  booleanAttribute,
  effect,
  signal,
  Signal,
  WritableSignal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { merge, startWith, Subscription } from 'rxjs';
import clsx from 'clsx';

export type CheckboxSize = 'sm' | 'md' | 'lg';

const CLASSES = {
  container: 'flex items-start gap-3',
  wrapper: 'relative inline-flex items-center cursor-pointer',
  // Hidden native input (sr-only)
  input: 'sr-only',
  // Custom checkbox visual
  customCheckbox: {
    base: 'flex items-center justify-center rounded border-2 transition-all duration-200 cursor-pointer',
    size: {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6',
    },
    state: {
      normal: 'border-gold-500 bg-transparent',
      focus: 'peer-focus:ring-2 peer-focus:ring-gold-500/20 peer-focus:ring-offset-2 peer-focus:ring-offset-smoke-900',
      disabled: 'border-smoke-800 bg-smoke-900 cursor-not-allowed opacity-50',
    },
  },
  // Inner square (shown when checked)
  innerSquare: {
    base: 'bg-gold-500 rounded transition-opacity duration-200 pointer-events-none',
    size: {
      sm: 'w-2.5 h-2.5',
      md: 'w-3 h-3',
      lg: 'w-4 h-4',
    },
    visible: 'opacity-100',
    hidden: 'opacity-0',
  },
  label: {
    base: 'cursor-pointer',
    size: {
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg',
    },
    title: 'font-medium text-smoke-100',
    description: 'text-xs text-smoke-200 mt-0.5',
  },
};

let checkboxIdCounter: number = 0;

/**
 * Checkbox component - Themed checkbox with label and description
 *
 * @example
 * ```html
 * <ui-checkbox
 *   checkboxId="auto-approve"
 *   label="Approbation automatique"
 *   description="Accepter automatiquement les demandes"
 *   [control]="autoApproveControl"
 * />
 * ```
 */
@Component({
  selector: 'ui-checkbox',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  host: {
    class: 'block',
  },
  template: `
    <div [class]="containerClasses()">
      <!-- Label contains input = click anywhere triggers input -->
      <label [class]="CLASSES.wrapper">
        <!-- Hidden native input -->
        <input
          [id]="checkboxId()"
          type="checkbox"
          [checked]="control().value"
          (change)="onToggle($event)"
          [disabled]="control().disabled"
          [class]="CLASSES.input"
          [attr.aria-labelledby]="label() ? checkboxId() + '-label' : null"
          [attr.aria-describedby]="description() ? checkboxId() + '-desc' : null"
        />
        <!-- Custom checkbox visual -->
        <span [class]="customCheckboxClasses()">
          <!-- Inner square (shown when checked) -->
          <span [class]="innerSquareInnerClasses()"></span>
        </span>
      </label>
      @if (label() || description()) {
        <div [class]="CLASSES.label.base">
          @if (label()) {
            <label
              [id]="checkboxId() + '-label'"
              [for]="checkboxId()"
              [class]="labelClasses()"
            >
              {{ label() }}
            </label>
          }
          @if (description()) {
            <p
              [id]="checkboxId() + '-desc'"
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
export class CheckboxComponent {
  readonly checkboxId = input<string>(`checkbox-${++checkboxIdCounter}`);
  readonly size = input<CheckboxSize>('md');
  readonly label = input<string>('');
  readonly description = input<string>('');
  readonly control = input.required<FormControl<boolean>>();

  readonly #internalValue: WritableSignal<boolean> = signal<boolean>(false);

  readonly CLASSES = CLASSES;

  readonly containerClasses = computed<string>(() =>
    clsx(CLASSES.container)
  );

  readonly customCheckboxClasses = computed<string>(() => {
    const ctrl = this.control();

    return clsx(
      CLASSES.customCheckbox.base,
      CLASSES.customCheckbox.size[this.size()],
      ctrl?.disabled
        ? CLASSES.customCheckbox.state.disabled
        : [CLASSES.customCheckbox.state.normal, CLASSES.customCheckbox.state.focus]
    );
  });

  readonly innerSquareInnerClasses = computed<string>(() => {
    const isChecked = this.#internalValue();

    return clsx(
      CLASSES.innerSquare.base,
      CLASSES.innerSquare.size[this.size()],
      isChecked ? CLASSES.innerSquare.visible : CLASSES.innerSquare.hidden
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
