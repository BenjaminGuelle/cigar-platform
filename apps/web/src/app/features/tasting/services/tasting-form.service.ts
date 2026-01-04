import { Injectable, inject, OnDestroy, signal } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import type { Subscription } from 'rxjs';

/**
 * Finale Form Value
 */
export interface FinaleFormValue {
  rating: number;
  comment: string;
}

/**
 * Tasting Form Service
 * Gestion du formulaire Phase Finale uniquement
 *
 * ALL STARS Architecture ⭐
 * - Single Responsibility: Finale form management only
 * - Type-safe FormGroup with proper validation
 * - Reactive signal for rating (for computed dependencies)
 *
 * NOTE: Phase Quick utilise ses propres signaux dans le composant,
 * pas de FormGroup ici.
 *
 * @example
 * ```typescript
 * @Component({...})
 * export class PhaseFinaleComponent {
 *   formService = inject(TastingFormService);
 *   finaleForm = this.formService.finaleForm;
 * }
 * ```
 */
@Injectable()
export class TastingFormService implements OnDestroy {
  readonly #fb = inject(FormBuilder);

  #subscriptions: Subscription[] = [];

  /**
   * Phase Finale FormGroup
   * Captures: rating, comment
   */
  readonly finaleForm = this.#fb.nonNullable.group({
    rating: [0, [Validators.required, Validators.min(0.5)]],
    comment: ['', Validators.maxLength(1000)],
  });

  /**
   * Reactive signal for rating value (for computed dependencies)
   * Updated via valueChanges subscription to make it reactive
   */
  readonly ratingSignal = signal<number>(0);

  constructor() {
    // Subscribe to rating changes to update reactive signal
    const ratingSub = this.finaleForm.controls.rating.valueChanges.subscribe(rating => {
      this.ratingSignal.set(rating);
    });

    this.#subscriptions.push(ratingSub);
  }

  /**
   * Patch Finale form data (pre-fill from draft)
   */
  patchFinaleData(data: Partial<FinaleFormValue>): void {
    this.finaleForm.patchValue(data, { emitEvent: false });
    // Manually update rating signal since we're not emitting events
    if (data.rating !== undefined) {
      this.ratingSignal.set(data.rating);
    }
  }

  /**
   * Reset Finale form
   */
  resetFinaleForm(): void {
    this.finaleForm.reset({
      rating: 0,
      comment: '',
    });
    this.ratingSignal.set(0);
  }

  /**
   * Get finale form data for completing tasting
   * Returns rating + comment for CompleteTastingDto
   */
  getCompleteTastingData(): { rating: number; comment?: string } {
    const value = this.finaleForm.getRawValue();
    return {
      rating: value.rating,
      comment: value.comment || undefined,
    };
  }

  /**
   * Cleanup subscriptions
   */
  ngOnDestroy(): void {
    this.#subscriptions.forEach(sub => sub.unsubscribe());
  }
}
