import { Injectable, signal, afterNextRender, Injector, inject } from '@angular/core';
import { AbstractControl, FormGroup, FormArray } from '@angular/forms';

export interface FormValidationState {
  isValid: boolean;
  firstErrorField?: string;
}

/**
 * Service for managing form validation and error display
 * Provides utilities for triggering validation, scrolling to errors, and managing form state
 */
@Injectable({
  providedIn: 'root',
})
export class FormService {
  #injector = inject(Injector);
  #formState = signal<FormValidationState>({ isValid: true });
  #validationTrigger = signal(0);

  /**
   * Current form validation state (readonly)
   */
  get formState() {
    return this.#formState.asReadonly();
  }

  /**
   * Validation trigger signal for components to react to
   */
  get validationTrigger$() {
    return this.#validationTrigger.asReadonly();
  }

  /**
   * Triggers validation on all form controls and scrolls to first error
   * @param form - The FormGroup to validate
   */
  triggerValidation(form: FormGroup): void {
    // Mark all controls as touched and dirty
    this.#markAllAsTouchedAndDirty(form);

    // Update validity
    form.updateValueAndValidity({ onlySelf: false, emitEvent: true });

    // Notify all components listening to validation trigger
    this.#validationTrigger.update(v => v + 1);

    // Update form state
    const firstErrorField = this.#getFirstErrorField(form);
    this.#formState.set({
      isValid: form.valid,
      firstErrorField,
    });

    // Scroll to first error after DOM update
    if (firstErrorField) {
      afterNextRender(() => {
        this.#scrollToFirstError(firstErrorField);
      }, { injector: this.#injector });
    }
  }

  /**
   * Checks if a specific control has a specific error
   * @param form - The FormGroup containing the control
   * @param controlName - Name of the control
   * @param errorName - Name of the error to check
   */
  controlHasError(form: FormGroup, controlName: string, errorName: string): boolean {
    return form.get(controlName)?.hasError(errorName) || false;
  }

  /**
   * Marks all controls in a form as touched and dirty (recursive)
   */
  #markAllAsTouchedAndDirty(control: AbstractControl): void {
    if (control instanceof FormGroup) {
      Object.values(control.controls).forEach(childControl => {
        this.#markAllAsTouchedAndDirty(childControl);
      });
    } else if (control instanceof FormArray) {
      control.controls.forEach(childControl => {
        this.#markAllAsTouchedAndDirty(childControl);
      });
    }

    control.markAsTouched();
    control.markAsDirty();
  }

  /**
   * Scrolls to the first error field using its input ID
   */
  #scrollToFirstError(fieldName: string): void {
    // Try to find by input ID first (our Input component pattern)
    let element = document.getElementById(`input-${fieldName}`);

    // Fallback to formControlName attribute
    if (!element) {
      element = document.querySelector(`[formControlName="${fieldName}"]`) as HTMLElement;
    }

    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest',
      });

      // Optional: focus the element for keyboard users
      element.focus({ preventScroll: true });
    }
  }

  /**
   * Gets the name of the first control with an error
   */
  #getFirstErrorField(form: FormGroup): string | undefined {
    return this.#findFirstErrorInControl(form);
  }

  /**
   * Recursively finds the first error field (supports nested forms and arrays)
   */
  #findFirstErrorInControl(control: AbstractControl, parentPath = ''): string | undefined {
    if (control instanceof FormGroup) {
      for (const key of Object.keys(control.controls)) {
        const childControl = control.get(key);
        if (!childControl) continue;

        const path = parentPath ? `${parentPath}.${key}` : key;

        if (childControl.invalid && childControl.touched) {
          // If it's a group/array, recurse into it
          if (childControl instanceof FormGroup || childControl instanceof FormArray) {
            const nestedError = this.#findFirstErrorInControl(childControl, path);
            if (nestedError) return nestedError;
          } else {
            return key; // Return the field name without parent path for simplicity
          }
        }
      }
    } else if (control instanceof FormArray) {
      for (let i = 0; i < control.length; i++) {
        const childControl = control.at(i);
        const path = `${parentPath}[${i}]`;

        if (childControl.invalid && childControl.touched) {
          if (childControl instanceof FormGroup || childControl instanceof FormArray) {
            const nestedError = this.#findFirstErrorInControl(childControl, path);
            if (nestedError) return nestedError;
          } else {
            return `${parentPath}[${i}]`;
          }
        }
      }
    }

    return undefined;
  }
}
