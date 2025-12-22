import {
  Component,
  input,
  computed,
  booleanAttribute,
  effect,
  signal,
  Signal,
  WritableSignal,
  InputSignal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, ValidationErrors } from '@angular/forms';

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
})
export class InputComponent {
  readonly inputId: InputSignal<string> = input<string>(`input-${++inputIdCounter}`);
  readonly type: InputSignal<InputType> = input<InputType>('text');
  readonly size: InputSignal<InputSize> = input<InputSize>('md');
  readonly label: InputSignal<string> = input<string>('');
  readonly placeholder: InputSignal<string> = input<string>('');
  readonly hint: InputSignal<string> = input<string>('');
  readonly required: InputSignal<boolean> = input<boolean, boolean>(false, { transform: booleanAttribute });
  readonly readonly: InputSignal<boolean> = input<boolean, boolean>(false, { transform: booleanAttribute });
  readonly autofocus: InputSignal<boolean> = input<boolean, boolean>(false, { transform: booleanAttribute });
  readonly maxlength: InputSignal<number | null> = input<number | null>(null);
  readonly minlength: InputSignal<number | null> = input<number | null>(null);
  readonly prefixIcon: InputSignal<boolean> = input<boolean, boolean>(false, { transform: booleanAttribute });
  readonly suffixIcon: InputSignal<boolean> = input<boolean, boolean>(false, { transform: booleanAttribute });
  readonly autocomplete: InputSignal<AutocompleteValue> = input<AutocompleteValue>('off');
  readonly inputmode: InputSignal<InputMode | null> = input<InputMode | null>(null);
  readonly control: InputSignal<FormControl> = input.required<FormControl>();
  readonly errorMessages: InputSignal<ErrorMessages> = input<ErrorMessages>({});

  readonly #forceShowError: WritableSignal<boolean> = signal<boolean>(false);
  readonly #controlTouched: WritableSignal<boolean> = signal<boolean>(false);
  readonly #controlInvalid: WritableSignal<boolean> = signal<boolean>(false);

  readonly errorId: Signal<string> = computed<string>(() => `${this.inputId()}-error`);
  readonly hintId: Signal<string> = computed<string>(() => `${this.inputId()}-hint`);

  readonly showError: Signal<boolean> = computed<boolean>(() => {
    const isInvalid: boolean = this.#controlInvalid();
    const isTouched: boolean = this.#controlTouched();
    const isForced: boolean = this.#forceShowError();

    return isInvalid && (isTouched || isForced);
  });

  readonly errorMessage: Signal<string> = computed<string>(() => {
    const ctrl: FormControl = this.control();
    const errors: ValidationErrors | null = ctrl?.errors;

    if (!errors) {
      return '';
    }

    const customMessages: ErrorMessages = this.errorMessages();
    const errorKey: string = Object.keys(errors)[0];
    const errorValue: ValidationErrors = errors[errorKey];

    if (customMessages[errorKey]) {
      return customMessages[errorKey](errorValue);
    }

    if (DEFAULT_ERROR_MESSAGES[errorKey]) {
      return DEFAULT_ERROR_MESSAGES[errorKey](errorValue);
    }

    return 'Valeur invalide';
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
    const sizeClasses: Record<InputSize, string> = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2.5 text-base',
      lg: 'px-5 py-3 text-lg',
    };

    const baseClasses: string = 'w-full rounded-lg border-2 transition-all duration-200 focus:outline-none bg-smoke-850 text-smoke-100 placeholder:text-smoke-500';
    const prefixPadding: string = this.prefixIcon() ? 'pl-10' : '';
    const suffixPadding: string = this.suffixIcon() ? 'pr-10' : '';
    const errorClasses: string = this.showError()
      ? 'border-error-500/50 focus:border-error-500 focus:ring-2 focus:ring-error-500/20'
      : 'border-smoke-700 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20';
    const ctrl: FormControl = this.control();
    const disabledClasses: string = ctrl?.disabled ? 'bg-smoke-900 cursor-not-allowed opacity-50' : '';
    const readonlyClasses: string = this.readonly() ? 'bg-smoke-900 cursor-default' : '';

    return [
      baseClasses,
      sizeClasses[this.size()],
      prefixPadding,
      suffixPadding,
      errorClasses,
      disabledClasses,
      readonlyClasses,
    ]
      .filter(Boolean)
      .join(' ');
  });

  constructor() {
    effect(() => {
      const ctrl: FormControl | undefined = this.control();

      this.#controlTouched.set(ctrl?.touched || false);
      this.#controlInvalid.set(ctrl?.invalid || false);

      const subscription = ctrl?.events?.subscribe(() => {
        this.#controlTouched.set(ctrl.touched);
        this.#controlInvalid.set(ctrl.invalid);

        if (ctrl.touched) {
          this.#forceShowError.set(false);
        }
      });

      return (): void => subscription?.unsubscribe();
    });
  }

  /**
   * @internal
   */
  forceShowError(): void {
    this.#forceShowError.set(true);
  }
}