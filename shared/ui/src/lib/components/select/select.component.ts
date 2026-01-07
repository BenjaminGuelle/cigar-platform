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
  ElementRef,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, ValidationErrors } from '@angular/forms';
import { merge, startWith, Subscription, fromEvent } from 'rxjs';
import clsx from 'clsx';
import { LucideAngularModule, ChevronDown } from 'lucide-angular';

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
  button: {
    base: 'w-full rounded-lg border transition-all duration-200 focus:outline-none bg-transparent text-smoke-200 cursor-pointer flex items-center justify-between',
    size: {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2.5 text-base',
      lg: 'px-5 py-3 text-lg',
    },
    state: {
      error: 'border-error-500/50 focus:border-error-500 focus:ring-1 focus:ring-error-500/20',
      valid: 'border-smoke-600 focus:border-smoke-400 focus:ring-1 focus:ring-smoke-400/20',
      open: 'border-smoke-400 ring-1 ring-smoke-400/20',
      disabled: 'bg-smoke-800/30 cursor-not-allowed opacity-50',
    },
  },
  icon: {
    base: 'text-smoke-400 transition-transform duration-200',
    open: 'rotate-180',
  },
  dropdown: {
    base: 'absolute z-50 mt-2 w-full rounded-lg border border-smoke-600 bg-smoke-800 shadow-xl max-h-60 overflow-auto',
  },
  option: {
    base: 'px-4 py-2.5 cursor-pointer transition-colors duration-150',
    state: {
      normal: 'text-smoke-100 hover:bg-smoke-700 hover:text-gold-500',
      selected: 'bg-gold-500/10 text-gold-500 hover:bg-gold-500/20',
      highlighted: 'bg-smoke-700 text-gold-500',
      disabled: 'text-smoke-600 cursor-not-allowed',
    },
  },
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
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  host: {
    class: 'block',
  },
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
        <!-- Custom Select Button -->
        <button
          type="button"
          [id]="selectId()"
          [class]="buttonClasses()"
          [disabled]="control().disabled"
          [attr.aria-describedby]="ariaDescribedBy()"
          [attr.aria-invalid]="showError()"
          [attr.aria-expanded]="isOpen()"
          (click)="toggle()"
          (keydown)="handleKeyDown($event)"
        >
          <span [class]="!control().value && placeholder() ? 'text-smoke-500' : ''">
            {{ selectedLabel() }}
          </span>
          <lucide-icon
            [img]="ChevronDown"
            [size]="20"
            [class]="iconClasses()"
          />
        </button>

        <!-- Dropdown Menu -->
        @if (isOpen()) {
          <div [class]="CLASSES.dropdown.base">
            @for (option of options(); track option.value; let i = $index) {
              <div
                [class]="optionClasses(option, i)"
                (click)="selectOption(option)"
                (mouseenter)="highlightOption(i)"
              >
                {{ option.label }}
              </div>
            }
          </div>
        }
      </div>

      @if (hint() && !showError()) {
        <p [id]="hintId()" class="mt-1.5 text-xs text-smoke-200">
          {{ hint() }}
        </p>
      }

      @if (showError()) {
        <p [id]="errorId()" class="mt-1.5 text-xs text-error-400" role="alert">
          {{ errorMessage() }}
        </p>
      }
    </div>
  `,
})
export class SelectComponent {
  private readonly elementRef = inject(ElementRef);

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
  readonly #isOpen: WritableSignal<boolean> = signal<boolean>(false);
  readonly #highlightedIndex: WritableSignal<number> = signal<number>(-1);
  readonly #currentValue: WritableSignal<any> = signal<any>(null);

  readonly ChevronDown = ChevronDown;
  readonly CLASSES = CLASSES;

  readonly isOpen = this.#isOpen.asReadonly();

  readonly selectedLabel: Signal<string> = computed<string>(() => {
    const value = this.#currentValue();
    const option = this.options().find((opt) => opt.value === value);
    return option?.label ?? this.placeholder() ?? 'Sélectionner';
  });

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

  readonly buttonClasses: Signal<string> = computed<string>(() => {
    const ctrl: FormControl = this.control();
    const open = this.isOpen();

    return clsx(
      CLASSES.button.base,
      CLASSES.button.size[this.size()],
      ctrl?.disabled && CLASSES.button.state.disabled,
      !ctrl?.disabled && (
        this.showError()
          ? CLASSES.button.state.error
          : open
            ? CLASSES.button.state.open
            : CLASSES.button.state.valid
      )
    );
  });

  readonly iconClasses: Signal<string> = computed<string>(() => {
    return clsx(
      CLASSES.icon.base,
      this.isOpen() && CLASSES.icon.open
    );
  });

  optionClasses(option: SelectOption, index: number): string {
    const isSelected = this.control().value === option.value;
    const isHighlighted = this.#highlightedIndex() === index;

    return clsx(
      CLASSES.option.base,
      option.disabled
        ? CLASSES.option.state.disabled
        : isSelected
          ? CLASSES.option.state.selected
          : isHighlighted
            ? CLASSES.option.state.highlighted
            : CLASSES.option.state.normal
    );
  }

  constructor() {
    // FormControl status/value changes effect
    effect((onCleanup) => {
      const ctrl: FormControl = this.control();

      this.#updateSignals(ctrl);
      this.#currentValue.set(ctrl.value);

      const subscription: Subscription = merge(
        ctrl.statusChanges,
        ctrl.valueChanges
      )
        .pipe(startWith(null))
        .subscribe(() => {
          this.#updateSignals(ctrl);
          this.#currentValue.set(ctrl.value);

          if (ctrl.touched) {
            this.#forceShowError.set(false);
          }
        });

      onCleanup(() => {
        subscription.unsubscribe();
      });
    });

    // Click outside to close dropdown effect
    effect((onCleanup) => {
      if (!this.isOpen()) {
        return;
      }

      const handleClickOutside = (event: Event) => {
        const target = event.target as Node;
        if (!this.elementRef.nativeElement.contains(target)) {
          this.close();
        }
      };

      // Use setTimeout to avoid closing immediately after opening
      const timeoutId = setTimeout(() => {
        document.addEventListener('click', handleClickOutside);
      }, 0);

      onCleanup(() => {
        clearTimeout(timeoutId);
        document.removeEventListener('click', handleClickOutside);
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

  toggle(): void {
    if (this.control().disabled) {
      return;
    }

    const willOpen = !this.#isOpen();
    this.#isOpen.set(willOpen);

    if (willOpen) {
      // Find and highlight current selected option
      const currentValue = this.control().value;
      const currentIndex = this.options().findIndex((opt) => opt.value === currentValue);
      this.#highlightedIndex.set(currentIndex >= 0 ? currentIndex : 0);
    } else {
      this.#highlightedIndex.set(-1);
    }
  }

  selectOption(option: SelectOption): void {
    if (option.disabled) {
      return;
    }
    this.control().setValue(option.value);
    this.control().markAsTouched();
    this.close();
  }

  close(): void {
    this.#isOpen.set(false);
    this.#highlightedIndex.set(-1);
  }

  highlightOption(index: number): void {
    this.#highlightedIndex.set(index);
  }

  handleKeyDown(event: KeyboardEvent): void {
    if (this.control().disabled) {
      return;
    }

    const opts = this.options();
    const enabledOptions = opts.filter((opt) => !opt.disabled);

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!this.#isOpen()) {
          this.toggle();
        } else {
          this.#navigateDown(enabledOptions);
        }
        break;

      case 'ArrowUp':
        event.preventDefault();
        if (!this.#isOpen()) {
          this.toggle();
        } else {
          this.#navigateUp(enabledOptions);
        }
        break;

      case 'Enter':
      case ' ':
        event.preventDefault();
        if (this.#isOpen()) {
          const highlighted = this.#highlightedIndex();
          if (highlighted >= 0 && highlighted < opts.length) {
            this.selectOption(opts[highlighted]);
          }
        } else {
          this.toggle();
        }
        break;

      case 'Escape':
        event.preventDefault();
        if (this.#isOpen()) {
          this.close();
        }
        break;

      case 'Home':
        event.preventDefault();
        if (this.#isOpen() && enabledOptions.length > 0) {
          const firstEnabledIndex = opts.findIndex((opt) => !opt.disabled);
          this.#highlightedIndex.set(firstEnabledIndex);
        }
        break;

      case 'End':
        event.preventDefault();
        if (this.#isOpen() && enabledOptions.length > 0) {
          const lastEnabledIndex = opts.length - 1 - [...opts].reverse().findIndex((opt) => !opt.disabled);
          this.#highlightedIndex.set(lastEnabledIndex);
        }
        break;
    }
  }

  #navigateDown(enabledOptions: SelectOption[]): void {
    const opts = this.options();
    const currentHighlight = this.#highlightedIndex();

    // Find next enabled option
    for (let i = currentHighlight + 1; i < opts.length; i++) {
      if (!opts[i].disabled) {
        this.#highlightedIndex.set(i);
        return;
      }
    }

    // Wrap to first enabled option
    for (let i = 0; i <= currentHighlight; i++) {
      if (!opts[i].disabled) {
        this.#highlightedIndex.set(i);
        return;
      }
    }
  }

  #navigateUp(enabledOptions: SelectOption[]): void {
    const opts = this.options();
    const currentHighlight = this.#highlightedIndex();

    // Find previous enabled option
    for (let i = currentHighlight - 1; i >= 0; i--) {
      if (!opts[i].disabled) {
        this.#highlightedIndex.set(i);
        return;
      }
    }

    // Wrap to last enabled option
    for (let i = opts.length - 1; i >= currentHighlight; i--) {
      if (!opts[i].disabled) {
        this.#highlightedIndex.set(i);
        return;
      }
    }
  }
}
