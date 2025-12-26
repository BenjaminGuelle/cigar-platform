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
  wrapper: 'flex items-center',
  input: {
    base: 'rounded transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-smoke-900',
    size: {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6',
    },
    state: {
      normal: 'border-2 border-smoke-700 bg-smoke-850 text-gold-500 focus:ring-gold-500/20',
      disabled: 'border-smoke-800 bg-smoke-900 cursor-not-allowed opacity-50',
    },
  },
  label: {
    base: 'cursor-pointer',
    size: {
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg',
    },
    title: 'font-medium text-smoke-100',
    description: 'text-sm text-smoke-400 mt-0.5',
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
  template: `
    <div [class]="containerClasses()">
      <div [class]="CLASSES.wrapper">
        <input
          [id]="checkboxId()"
          type="checkbox"
          [formControl]="control()"
          [class]="inputClasses()"
          [attr.aria-labelledby]="label() ? checkboxId() + '-label' : null"
          [attr.aria-describedby]="description() ? checkboxId() + '-desc' : null"
        />
      </div>
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

  readonly CLASSES = CLASSES;

  readonly containerClasses = computed<string>(() =>
    clsx(CLASSES.container)
  );

  readonly inputClasses = computed<string>(() => {
    const ctrl = this.control();

    return clsx(
      CLASSES.input.base,
      CLASSES.input.size[this.size()],
      ctrl?.disabled ? CLASSES.input.state.disabled : CLASSES.input.state.normal
    );
  });

  readonly labelClasses = computed<string>(() =>
    clsx(
      CLASSES.label.size[this.size()],
      CLASSES.label.title
    )
  );
}
