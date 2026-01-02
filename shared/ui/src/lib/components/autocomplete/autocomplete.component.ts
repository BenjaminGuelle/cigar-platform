import {
  Component,
  input,
  computed,
  booleanAttribute,
  effect,
  signal,
  Signal,
  WritableSignal,
  ElementRef,
  inject,
  output,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, ValidationErrors } from '@angular/forms';
import { merge, startWith, Subscription, debounceTime } from 'rxjs';
import clsx from 'clsx';
import { LucideAngularModule, ChevronDown, Plus } from 'lucide-angular';
import { ErrorMessageFn, ErrorMessages } from '../input/input.component';

export type AutocompleteSize = 'sm' | 'md' | 'lg';

export interface AutocompleteOption {
  value: string;
  label: string;
  metadata?: string; // e.g., "Cuba" for brand country
  logoUrl?: string; // e.g., brand logo URL
  avatarText?: string; // e.g., "C" for cigar initial (fallback if no logoUrl)
  disabled?: boolean;
}

const DEFAULT_ERROR_MESSAGES: ErrorMessages = {
  required: () => 'Ce champ est obligatoire',
};

const CLASSES = {
  container: 'relative',
  input: {
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
    },
  },
  dropdown: {
    base: 'absolute z-50 mt-2 w-full rounded-lg border-2 border-smoke-700 bg-smoke-850 shadow-xl max-h-60 overflow-auto',
  },
  option: {
    base: 'px-4 py-2.5 cursor-pointer transition-colors duration-150',
    state: {
      normal: 'text-smoke-100 hover:bg-smoke-700 hover:text-gold-500',
      highlighted: 'bg-smoke-700 text-gold-500',
      disabled: 'text-smoke-600 cursor-not-allowed',
    },
  },
  createOption: {
    base: 'px-4 py-2.5 cursor-pointer transition-colors duration-150 border-t-2 border-smoke-700 flex items-center gap-2 text-gold-500 hover:bg-gold-500/10',
  },
  logo: {
    image: 'w-8 h-8 rounded-md object-contain',
    fallback: 'w-8 h-8 rounded-md bg-gradient-to-br from-gold-600 to-gold-400 flex items-center justify-center',
    fallbackText: 'text-smoke-900 font-bold text-sm',
  },
};

let autocompleteIdCounter = 0;

/**
 * Autocomplete component - Search input with dropdown suggestions
 *
 * Features:
 * - Debounced search (300ms)
 * - Keyboard navigation (Arrow keys, Enter, Escape)
 * - "Create new" option when no exact match
 * - Premium logo display with golden fallback
 * - Reactive with signals (ALL STARS ⭐)
 *
 * @example
 * ```html
 * <ui-autocomplete
 *   label="Marque"
 *   placeholder="Rechercher une marque..."
 *   [control]="brandControl"
 *   [options]="brandOptions()"
 *   [loading]="brandsLoading()"
 *   [showCreateOption]="true"
 *   (search)="onBrandSearch($event)"
 *   (create)="onCreateBrand($event)"
 * />
 * ```
 */
@Component({
  selector: 'ui-autocomplete',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  host: {
    class: 'block',
  },
  templateUrl: './autocomplete.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AutocompleteComponent {
  private readonly elementRef = inject(ElementRef);

  // Inputs
  readonly autocompleteId = input<string>(`autocomplete-${++autocompleteIdCounter}`);
  readonly size = input<AutocompleteSize>('md');
  readonly label = input<string>('');
  readonly placeholder = input<string>('');
  readonly hint = input<string>('');
  readonly required = input(false, { transform: booleanAttribute });
  readonly options = input.required<AutocompleteOption[]>();
  readonly control = input.required<FormControl>();
  readonly errorMessages = input<ErrorMessages>({});
  readonly loading = input<boolean>(false);
  readonly showCreateOption = input<boolean>(true);
  readonly createLabel = input<string>('Créer');

  // Outputs
  readonly search = output<string>();
  readonly create = output<string>();
  readonly valueSelected = output<string>(); // Emits the selected value (UUID)

  // Internal state
  readonly #forceShowError: WritableSignal<boolean> = signal<boolean>(false);
  readonly #controlTouched: WritableSignal<boolean> = signal<boolean>(false);
  readonly #controlInvalid: WritableSignal<boolean> = signal<boolean>(false);
  readonly #controlErrors: WritableSignal<ValidationErrors | null> = signal<ValidationErrors | null>(null);
  readonly #isOpen: WritableSignal<boolean> = signal<boolean>(false);
  readonly #highlightedIndex: WritableSignal<number> = signal<number>(-1);
  readonly #searchQuery: WritableSignal<string> = signal<string>('');
  readonly #selectedValue: WritableSignal<string | null> = signal<string | null>(null); // Track selected UUID

  // Icons
  readonly ChevronDown = ChevronDown;
  readonly Plus = Plus;
  readonly CLASSES = CLASSES;

  // Computed
  readonly isOpen = this.#isOpen.asReadonly();
  readonly searchQuery = this.#searchQuery.asReadonly();

  readonly errorId: Signal<string> = computed<string>(() => `${this.autocompleteId()}-error`);
  readonly hintId: Signal<string> = computed<string>(() => `${this.autocompleteId()}-hint`);

  readonly showError: Signal<boolean> = computed<boolean>(() => {
    const isInvalid: boolean = this.#controlInvalid();
    const isTouched: boolean = this.#controlTouched();
    const isForced: boolean = this.#forceShowError();
    return isInvalid && (isTouched || isForced);
  });

  readonly errorMessage: Signal<string> = computed<string>(() => {
    const errors: ValidationErrors | null = this.#controlErrors();
    if (!errors) return '';

    const customMessages: ErrorMessages = this.errorMessages();
    if (errors['required']) {
      return customMessages['required']?.(errors['required']) ?? DEFAULT_ERROR_MESSAGES['required'](errors['required']);
    }

    const errorKey: string = Object.keys(errors)[0];
    return customMessages[errorKey]?.(errors[errorKey]) ?? 'Valeur invalide';
  });

  readonly ariaDescribedBy: Signal<string> = computed<string>(() => {
    if (this.showError()) return this.errorId();
    if (this.hint()) return this.hintId();
    return '';
  });

  readonly inputClasses: Signal<string> = computed<string>(() => {
    const ctrl: FormControl = this.control();
    return clsx(
      CLASSES.input.base,
      CLASSES.input.size[this.size()],
      this.showError() ? CLASSES.input.state.error : CLASSES.input.state.valid,
      ctrl?.disabled && CLASSES.input.state.disabled
    );
  });

  readonly hasExactMatch: Signal<boolean> = computed<boolean>(() => {
    const query = this.#searchQuery().trim().toLowerCase();
    if (!query) return false;
    return this.options().some(opt => opt.label.toLowerCase() === query);
  });

  readonly showCreate: Signal<boolean> = computed<boolean>(() => {
    return this.showCreateOption() &&
           this.#searchQuery().trim().length > 0 &&
           !this.hasExactMatch();
  });

  constructor() {
    // FormControl value changes effect (with debounce)
    effect((onCleanup) => {
      const ctrl: FormControl = this.control();
      this.#updateSignals(ctrl);

      const subscription: Subscription = merge(
        ctrl.statusChanges,
        ctrl.valueChanges.pipe(debounceTime(300))
      )
        .pipe(startWith(null))
        .subscribe(() => {
          this.#updateSignals(ctrl);
          const value = ctrl.value ?? '';
          this.#searchQuery.set(value);

          // Emit search event
          if (value.trim().length > 0) {
            this.search.emit(value);
          }

          if (ctrl.touched) {
            this.#forceShowError.set(false);
          }
        });

      onCleanup(() => subscription.unsubscribe());
    });

    // Click outside to close dropdown
    effect((onCleanup) => {
      if (!this.isOpen()) return;

      const handleClickOutside = (event: Event) => {
        const target = event.target as Node;
        if (!this.elementRef.nativeElement.contains(target)) {
          this.close();
        }
      };

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

  forceShowError(): void {
    this.#forceShowError.set(true);
  }

  setHighlightedIndex(index: number): void {
    this.#highlightedIndex.set(index);
  }

  onFocus(): void {
    this.#isOpen.set(true);
    this.#highlightedIndex.set(0);
  }

  onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.control().setValue(value); // Update FormControl for input display
    this.#isOpen.set(true);
    // Clear selected value when user starts typing again
    this.#selectedValue.set(null);
  }

  selectOption(option: AutocompleteOption): void {
    if (option.disabled) return;
    // Store label in FormControl for display
    this.control().setValue(option.label);
    this.control().markAsTouched();
    // Track the selected value (UUID) separately and emit it
    this.#selectedValue.set(option.value);
    this.valueSelected.emit(option.value);
    this.close();
  }

  onCreateNew(): void {
    const query = this.#searchQuery().trim();
    if (query) {
      this.create.emit(query);
      this.close();
    }
  }

  close(): void {
    this.#isOpen.set(false);
    this.#highlightedIndex.set(-1);
  }

  handleKeyDown(event: KeyboardEvent): void {
    if (this.control().disabled) return;

    const opts = this.options();
    const totalOptions = opts.length + (this.showCreate() ? 1 : 0);

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!this.#isOpen()) {
          this.#isOpen.set(true);
        } else {
          const next = (this.#highlightedIndex() + 1) % totalOptions;
          this.#highlightedIndex.set(next);
        }
        break;

      case 'ArrowUp':
        event.preventDefault();
        if (!this.#isOpen()) {
          this.#isOpen.set(true);
        } else {
          const prev = this.#highlightedIndex() - 1;
          this.#highlightedIndex.set(prev < 0 ? totalOptions - 1 : prev);
        }
        break;

      case 'Enter':
        event.preventDefault();
        if (this.#isOpen()) {
          const highlighted = this.#highlightedIndex();
          if (highlighted >= 0 && highlighted < opts.length) {
            this.selectOption(opts[highlighted]);
          } else if (highlighted === opts.length && this.showCreate()) {
            this.onCreateNew();
          }
        }
        break;

      case 'Escape':
        event.preventDefault();
        if (this.#isOpen()) {
          this.close();
        }
        break;
    }
  }

  optionClasses(index: number): string {
    const isHighlighted = this.#highlightedIndex() === index;
    return clsx(
      CLASSES.option.base,
      isHighlighted
        ? CLASSES.option.state.highlighted
        : CLASSES.option.state.normal
    );
  }

  createOptionClasses(): string {
    const isHighlighted = this.#highlightedIndex() === this.options().length;
    return clsx(
      CLASSES.createOption.base,
      isHighlighted && 'bg-gold-500/10'
    );
  }
}
