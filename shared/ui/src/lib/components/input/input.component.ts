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
import { ReactiveFormsModule, FormControl, ValidationErrors } from '@angular/forms';
import { merge, startWith, Subscription } from 'rxjs';
import clsx from 'clsx';

export type InputType = 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search';
export type InputSize = 'sm' | 'md' | 'lg';
export type AutocompleteValue = 'on' | 'off' | 'name' | 'email' | 'username' | 'new-password' | 'current-password' | 'tel' | 'url';
export type InputMode = 'none' | 'text' | 'decimal' | 'numeric' | 'tel' | 'search' | 'email' | 'url';
export type ErrorMessageFn = (error: ValidationErrors) => string;
export type ErrorMessages = Record<string, ErrorMessageFn>;

const DEFAULT_ERROR_MESSAGES: ErrorMessages = {
  required: () => 'Ce champ est obligatoire',
  email: () => 'Veuillez saisir une adresse email valide',
  minlength: (error: ValidationErrors) => `Minimum ${error['requiredLength']} caractères`,
  maxlength: (error: ValidationErrors) => `Maximum ${error['requiredLength']} caractères`,
  min: (error: ValidationErrors) => `La valeur minimale est ${error['min']}`,
  max: (error: ValidationErrors) => `La valeur maximale est ${error['max']}`,
  pattern: () => 'Format invalide',
};

const CLASSES = {
  base: 'w-full rounded-lg border-2 transition-all duration-200 focus:outline-none bg-smoke-850 text-smoke-100 placeholder:text-smoke-500',
  size: {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-base',
    lg: 'px-5 py-3 text-lg',
  },
  state: {
    error: 'border-error-500/50 focus:border-error-500 focus:ring-2 focus:ring-error-500/20',
    valid: 'border-smoke-700 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20',
    disabled: 'bg-smoke-900 cursor-not-allowed opacity-50',
    readonly: 'bg-smoke-900 cursor-default',
  },
  icon: {
    prefix: 'pl-10',
    suffix: 'pr-10',
  },
};

let inputIdCounter: number = 0;

/**
 * Input component - Form input with validation, error messages, and accessibility
 *
 * @example
 * ```html
 * <ui-input
 *   inputId="email"
 *   type="email"
 *   label="Email"
 *   placeholder="votre@email.com"
 *   [control]="emailControl"
 *   [required]="true"
 *   autocomplete="email"
 * />
 * ```
 */
@Component({
  selector: 'ui-input',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './input.component.html',
  host: {
    class: 'block',
  },
})
export class InputComponent {
  readonly inputId = input<string>(`input-${++inputIdCounter}`);
  readonly type = input<InputType>('text');
  readonly size = input<InputSize>('md');
  readonly label = input<string>('');
  readonly placeholder = input<string>('');
  readonly hint = input<string>('');
  readonly required = input(false, { transform: booleanAttribute });
  readonly readonly = input(false, { transform: booleanAttribute });
  readonly autofocus = input(false, { transform: booleanAttribute });
  readonly maxlength = input<number | null>(null);
  readonly minlength = input<number | null>(null);
  readonly prefix = input<string>('');
  readonly prefixIcon = input(false, { transform: booleanAttribute });
  readonly suffixIcon = input(false, { transform: booleanAttribute });
  readonly autocomplete = input<AutocompleteValue>('off');
  readonly inputmode = input<InputMode | null>(null);
  readonly control = input.required<FormControl>();
  readonly errorMessages = input<ErrorMessages>({});

  readonly #forceShowError: WritableSignal<boolean> = signal<boolean>(false);
  readonly #controlTouched: WritableSignal<boolean> = signal<boolean>(false);
  readonly #controlDirty: WritableSignal<boolean> = signal<boolean>(false);
  readonly #controlInvalid: WritableSignal<boolean> = signal<boolean>(false);
  readonly #controlErrors: WritableSignal<ValidationErrors | null> = signal<ValidationErrors | null>(null);

  readonly errorId: Signal<string> = computed<string>(() => `${this.inputId()}-error`);
  readonly hintId: Signal<string> = computed<string>(() => `${this.inputId()}-hint`);

  readonly showError: Signal<boolean> = computed<boolean>(() => {
    const isInvalid: boolean = this.#controlInvalid();
    const isTouched: boolean = this.#controlTouched();
    const isDirty: boolean = this.#controlDirty();
    const isForced: boolean = this.#forceShowError();

    // Show errors immediately when user starts typing (dirty) OR after blur (touched) OR forced
    return isInvalid && (isDirty || isTouched || isForced);
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

    if (errors['email']) {
      return customMessages['email']?.(errors['email']) ?? DEFAULT_ERROR_MESSAGES['email'](errors['email']);
    }

    if (errors['minlength']) {
      return customMessages['minlength']?.(errors['minlength']) ?? DEFAULT_ERROR_MESSAGES['minlength'](errors['minlength']);
    }

    if (errors['maxlength']) {
      return customMessages['maxlength']?.(errors['maxlength']) ?? DEFAULT_ERROR_MESSAGES['maxlength'](errors['maxlength']);
    }

    if (errors['min']) {
      return customMessages['min']?.(errors['min']) ?? DEFAULT_ERROR_MESSAGES['min'](errors['min']);
    }

    if (errors['max']) {
      return customMessages['max']?.(errors['max']) ?? DEFAULT_ERROR_MESSAGES['max'](errors['max']);
    }

    if (errors['pattern']) {
      return customMessages['pattern']?.(errors['pattern']) ?? DEFAULT_ERROR_MESSAGES['pattern'](errors['pattern']);
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

  readonly inputClasses: Signal<string> = computed<string>(() => {
    const ctrl: FormControl = this.control();

    return clsx(
      CLASSES.base,
      CLASSES.size[this.size()],
      this.prefix() && 'pl-8', // Add padding for text prefix
      this.prefixIcon() && CLASSES.icon.prefix,
      this.suffixIcon() && CLASSES.icon.suffix,
      this.showError() ? CLASSES.state.error : CLASSES.state.valid,
      ctrl?.disabled && CLASSES.state.disabled,
      this.readonly() && CLASSES.state.readonly
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
    this.#controlDirty.set(ctrl.dirty);
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