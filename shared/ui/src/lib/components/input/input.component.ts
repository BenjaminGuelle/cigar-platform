import {
  Component,
  input,
  computed,
  booleanAttribute,
  numberAttribute,
  effect,
  signal,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, ValidationErrors } from '@angular/forms';

// Types
export type InputType = 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search';
export type InputSize = 'sm' | 'md' | 'lg';
export type AutocompleteValue = 'on' | 'off' | 'name' | 'email' | 'username' | 'new-password' | 'current-password' | 'tel' | 'url';
export type InputMode = 'none' | 'text' | 'decimal' | 'numeric' | 'tel' | 'search' | 'email' | 'url';

// Error messages type
export type ErrorMessageFn = (error: ValidationErrors) => string;
export type ErrorMessages = Record<string, ErrorMessageFn>;

// Default French error messages
const DEFAULT_ERROR_MESSAGES: ErrorMessages = {
  required: () => 'Ce champ est obligatoire',
  email: () => 'Veuillez saisir une adresse email valide',
  minlength: (error) => `Minimum ${error['requiredLength']} caractères`,
  maxlength: (error) => `Maximum ${error['requiredLength']} caractères`,
  min: (error) => `La valeur minimale est ${error['min']}`,
  max: (error) => `La valeur maximale est ${error['max']}`,
  pattern: () => 'Format invalide',
};

// ID counter for unique IDs
let inputIdCounter = 0;

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
  // Inputs - Identification & Type
  inputId = input<string>(`input-${++inputIdCounter}`);
  type = input<InputType>('text');
  size = input<InputSize>('md');

  // Inputs - Labels & Text
  label = input<string>('');
  placeholder = input<string>('');
  hint = input<string>('');

  // Inputs - Validation
  required = input(false, { transform: booleanAttribute });
  readonly = input(false, { transform: booleanAttribute });
  autofocus = input(false, { transform: booleanAttribute });
  maxlength = input<number | null>(null);
  minlength = input<number | null>(null);

  // Inputs - Icons
  prefixIcon = input(false, { transform: booleanAttribute });
  suffixIcon = input(false, { transform: booleanAttribute });

  // Inputs - HTML Attributes
  autocomplete = input<AutocompleteValue>('off');
  inputmode = input<InputMode | null>(null);

  // Inputs - Form Control & Errors
  control = input.required<FormControl>();
  errorMessages = input<ErrorMessages>({});

  // Internal signals
  #forceShowError = signal(false);

  // Computed IDs for ARIA
  errorId = computed(() => `${this.inputId()}-error`);
  hintId = computed(() => `${this.inputId()}-hint`);

  // Computed - Show error (touched OR forced by validation trigger)
  showError = computed<boolean>(() => {
    const ctrl = this.control();
    return !!(ctrl?.invalid && (ctrl?.touched || this.#forceShowError()));
  });

  // Computed - Error message
  errorMessage = computed<string>(() => {
    const ctrl = this.control();
    const errors = ctrl?.errors;
    if (!errors) return '';

    const customMessages = this.errorMessages();
    const errorKey = Object.keys(errors)[0];
    const errorValue = errors[errorKey];

    // Custom error message
    if (customMessages[errorKey]) {
      return customMessages[errorKey](errorValue);
    }

    // Default error message
    if (DEFAULT_ERROR_MESSAGES[errorKey]) {
      return DEFAULT_ERROR_MESSAGES[errorKey](errorValue);
    }

    return 'Valeur invalide';
  });

  // Computed - ARIA describedby
  ariaDescribedBy = computed<string>(() => {
    if (this.showError()) {
      return this.errorId();
    }
    if (this.hint()) {
      return this.hintId();
    }
    return '';
  });

  // Computed - Input classes with size variants
  inputClasses = computed<string>(() => {
    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2.5 text-base',
      lg: 'px-5 py-3 text-lg',
    };

    const baseClasses = 'w-full rounded-lg border-2 transition-all duration-200 focus:outline-none bg-smoke-850 text-smoke-100 placeholder:text-smoke-500';
    const prefixPadding = this.prefixIcon() ? 'pl-10' : '';
    const suffixPadding = this.suffixIcon() ? 'pr-10' : '';
    const errorClasses = this.showError()
      ? 'border-error-500/50 focus:border-error-500 focus:ring-2 focus:ring-error-500/20'
      : 'border-smoke-700 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20';
    const ctrl = this.control();
    const disabledClasses = ctrl?.disabled ? 'bg-smoke-900 cursor-not-allowed opacity-50' : '';
    const readonlyClasses = this.readonly() ? 'bg-smoke-900 cursor-default' : '';

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
    // React to control status changes to show/hide forced errors
    effect(() => {
      const ctrl = this.control();

      // Listen to control touched state
      if (ctrl?.touched) {
        this.#forceShowError.set(false);
      }
    });
  }

  /**
   * Force display of error (called by FormService.triggerValidation)
   * @internal
   */
  forceShowError(): void {
    this.#forceShowError.set(true);
  }
}
