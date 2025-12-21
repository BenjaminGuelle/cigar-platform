import { Component, input, computed, booleanAttribute } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';

export type InputType = 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';

// Error messages mapping
const DEFAULT_ERROR_MESSAGES: Record<string, (error?: any) => string> = {
  required: () => 'This field is required',
  email: () => 'Please enter a valid email address',
  minlength: (error) => `Minimum length is ${error?.requiredLength} characters`,
  maxlength: (error) => `Maximum length is ${error?.requiredLength} characters`,
  min: (error) => `Minimum value is ${error?.min}`,
  max: (error) => `Maximum value is ${error?.max}`,
  pattern: () => 'Invalid format',
};

@Component({
  selector: 'ui-input',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="w-full">
      @if (label()) {
        <label [for]="inputId()" class="mb-2 block text-sm font-semibold text-smoke-200">
          {{ label() }}
          @if (required()) {
            <span class="text-error-500">*</span>
          }
        </label>
      }

      <div class="relative">
        @if (prefixIcon()) {
          <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <ng-content select="[slot=prefix-icon]" />
          </div>
        }

        <input
          [id]="inputId()"
          [type]="type()"
          [placeholder]="placeholder()"
          [formControl]="control()"
          [class]="inputClasses()"
        />

        @if (suffixIcon()) {
          <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <ng-content select="[slot=suffix-icon]" />
          </div>
        }
      </div>

      @if (showError()) {
        <div class="mt-1.5 text-xs text-error-400">
          {{ errorMessage() }}
        </div>
      }

      @if (hint() && !showError()) {
        <div class="mt-1.5 text-xs text-smoke-400">
          {{ hint() }}
        </div>
      }
    </div>
  `,
})
export class InputComponent {
  // Inputs
  inputId = input<string>(`input-${Math.random().toString(36).substring(2, 11)}`);
  type = input<InputType>('text');
  label = input<string>('');
  placeholder = input<string>('');
  hint = input<string>('');
  required = input(false, { transform: booleanAttribute });
  prefixIcon = input(false, { transform: booleanAttribute });
  suffixIcon = input(false, { transform: booleanAttribute });
  control = input.required<FormControl>();
  errorMessages = input<Record<string, (error?: any) => string>>({});

  // Computed properties
  showError = computed<boolean>(() => {
    const ctrl = this.control();
    return !!(ctrl?.invalid && ctrl?.touched);
  });

  errorMessage = computed<string>(() => {
    const ctrl = this.control();
    const errors = ctrl?.errors;
    if (!errors) return '';

    const customMessages = this.errorMessages();
    const errorKey = Object.keys(errors)[0];
    const errorValue = errors[errorKey];

    // Use custom error message if provided
    if (customMessages[errorKey]) {
      return customMessages[errorKey](errorValue);
    }

    // Use default error message
    if (DEFAULT_ERROR_MESSAGES[errorKey]) {
      return DEFAULT_ERROR_MESSAGES[errorKey](errorValue);
    }

    return 'Invalid value';
  });

  inputClasses = computed<string>(() => {
    const baseClasses = 'w-full rounded-lg border-2 px-4 py-2.5 transition-all duration-200 focus:outline-none bg-smoke-850 text-smoke-100 placeholder:text-smoke-500';
    const prefixPadding = this.prefixIcon() ? 'pl-10' : '';
    const suffixPadding = this.suffixIcon() ? 'pr-10' : '';
    const errorClasses = this.showError()
      ? 'border-error-500/50 focus:border-error-500 focus:ring-2 focus:ring-error-500/20'
      : 'border-smoke-700 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20';
    const ctrl = this.control();
    const disabledClasses = ctrl?.disabled ? 'bg-smoke-900 cursor-not-allowed opacity-50' : '';

    return [baseClasses, prefixPadding, suffixPadding, errorClasses, disabledClasses]
      .filter(Boolean)
      .join(' ');
  });
}
