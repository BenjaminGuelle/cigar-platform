import {
  Component,
  input,
  computed,
  booleanAttribute,
  effect,
  signal,
  Signal,
  WritableSignal,
  contentChildren,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, ValidationErrors } from '@angular/forms';
import { merge, startWith, Subscription } from 'rxjs';
import clsx from 'clsx';

export type SelectSize = 'sm' | 'md' | 'lg';
export type ErrorMessageFn = (error: ValidationErrors) => string;
export type ErrorMessages = Record<string, ErrorMessageFn>;

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

const DEFAULT_ERROR_MESSAGES: ErrorMessages = {
  required: () => 'Ce champ est obligatoire',
};

const CLASSES = {
  base: 'w-full rounded-lg border-2 transition-all duration-200 focus:outline-none bg-smoke-850 text-smoke-100 cursor-pointer',
  size: {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-base',
    lg: 'px-5 py-3 text-lg',
  },
  state: {
    error: 'border-error-500/50 focus:border-error-500 focus:ring-2 focus:ring-error-500/20',
    valid: 'border-smoke-700 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20',
    disabled: 'bg-smoke-900 cursor-not-allowed opacity-50',
  },
  icon: 'pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-smoke-400',
};

let selectIdCounter: number = 0;

/**
 * Select component - Themed dropdown with validation and error messages
 *
 * @example
 * ```html
 * <ui-select
 *   selectId="visibility"
 *   label="Visibilité"
 *   hint="Choisissez la visibilité du club"
 *   [control]="visibilityControl"
 *   [options]="visibilityOptions"
 *   [required]="true"
 * />
 * ```
 */
@Component({
  selector: 'ui-select',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="space-y-1.5">
      @if (label()) {
        <label
          [for]="selectId()"
          class="block text-sm font-medium text-smoke-100"
        >
          {{ label() }}
          @if (required()) {
            <span class="text-error-500 ml-1">*</span>
          }
        </label>
      }

      <div class="relative">
        <select
          [id]="selectId()"
          [formControl]="control()"
          [class]="selectClasses()"
          [attr.aria-describedby]="ariaDescribedBy()"
          [attr.aria-invalid]="showError()"
        >
          @if (placeholder()) {
            <option value="" disabled [selected]="!control().value">
              {{ placeholder() }}
            </option>
          }
          @for (option of options(); track option.value) {
            <option
              [value]="option.value"
              [disabled]="option.disabled || false"
            >
              {{ option.label }}
            </option>
          }
        </select>

        <!-- Dropdown Icon -->
        <div [class]="CLASSES.icon">
          <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fill-rule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clip-rule="evenodd"
            />
          </svg>
        </div>
      </div>

      @if (hint() && !showError()) {
        <p [id]="hintId()" class="text-sm text-smoke-400">
          {{ hint() }}
        </p>
      }

      @if (showError()) {
        <p [id]="errorId()" class="text-sm text-error-500" role="alert">
          {{ errorMessage() }}
        </p>
      }
    </div>
  `,
})
export class SelectComponent {
  readonly selectId = input<string>(`select-${++selectIdCounter}`);
  readonly size = input<SelectSize>('md');
  readonly label = input<string>('');
  readonly placeholder = input<string>('');
  readonly hint = input<string>('');
  readonly required = input(false, { transform: booleanAttribute });
  readonly options = input.required<SelectOption[]>();
  readonly control = input.required<FormControl>();
  readonly errorMessages = input<ErrorMessages>({});

  readonly #forceShowError: WritableSignal<boolean> = signal<boolean>(false);
  readonly #controlTouched: WritableSignal<boolean> = signal<boolean>(false);
  readonly #controlInvalid: WritableSignal<boolean> = signal<boolean>(false);
  readonly #controlErrors: WritableSignal<ValidationErrors | null> = signal<ValidationErrors | null>(null);

  readonly CLASSES = CLASSES;

  readonly errorId: Signal<string> = computed<string>(() => `${this.selectId()}-error`);
  readonly hintId: Signal<string> = computed<string>(() => `${this.selectId()}-hint`);

  readonly showError: Signal<boolean> = computed<boolean>(() => {
    const isInvalid: boolean = this.#controlInvalid();
    const isTouched: boolean = this.#controlTouched();
    const isForced: boolean = this.#forceShowError();

    return isInvalid && (isTouched || isForced);
  });

  readonly errorMessage: Signal<string> = computed<string>(() => {
    const errors: ValidationErrors | null = this.#controlErrors();

    if (!errors) {
      return '';
    }

    const customMessages: ErrorMessages = this.errorMessages();

    if (errors['required']) {
      return customMessages['required']?.(errors['required']) ?? DEFAULT_ERROR_MESSAGES['required'](errors['required']);
    }

    const errorKey: string = Object.keys(errors)[0];
    return customMessages[errorKey]?.(errors[errorKey]) ?? 'Valeur invalide';
  });

  readonly ariaDescribedBy: Signal<string> = computed<string>(() => {
    if (this.showError()) {
      return this.errorId();
    }

    if (this.hint()) {
      return this.hintId();
    }

    return '';
  });

  readonly selectClasses: Signal<string> = computed<string>(() => {
    const ctrl: FormControl = this.control();

    return clsx(
      CLASSES.base,
      CLASSES.size[this.size()],
      this.showError() ? CLASSES.state.error : CLASSES.state.valid,
      ctrl?.disabled && CLASSES.state.disabled
    );
  });

  constructor() {
    effect((onCleanup) => {
      const ctrl: FormControl = this.control();

      this.#updateSignals(ctrl);

      const subscription: Subscription = merge(
        ctrl.statusChanges,
        ctrl.valueChanges
      )
        .pipe(startWith(null))
        .subscribe(() => {
          this.#updateSignals(ctrl);

          if (ctrl.touched) {
            this.#forceShowError.set(false);
          }
        });

      onCleanup(() => {
        subscription.unsubscribe();
      });
    });
  }

  #updateSignals(ctrl: FormControl): void {
    this.#controlTouched.set(ctrl.touched);
    this.#controlInvalid.set(ctrl.invalid);
    this.#controlErrors.set(ctrl.errors);
  }

  /**
   * @internal
   */
  forceShowError(): void {
    this.#forceShowError.set(true);
  }
}
