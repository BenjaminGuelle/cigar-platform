import { Injectable, inject, OnDestroy, signal } from '@angular/core';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { TastingAutoSaveService } from './tasting-auto-save.service';
import type {
  TastingMoment,
  TastingSituation,
  PairingType,
} from '@cigar-platform/shared/constants';
import type { Subscription } from 'rxjs';

/**
 * Quick Form Value
 */
export interface QuickFormValue {
  date: string;
  moment: TastingMoment;
  cigar: string;
  situation: TastingSituation | null;
  pairing: PairingType | null;
  pairingNote: string;
}

/**
 * Finale Form Value
 */
export interface FinaleFormValue {
  rating: number;
  comment: string;
}

/**
 * Tasting Form Service
 * Gestion centralisée des formulaires de dégustation
 *
 * ALL STARS Architecture ⭐
 * - Single Responsibility: Form management only
 * - Auto-save via TastingAutoSaveService (debounce already handled there)
 * - Type-safe FormGroups with proper validation
 * - Utility methods for patching and resetting
 *
 * Features:
 * - Phase Quick FormGroup (date, moment, cigar, situation, pairing, pairingNote)
 * - Phase Finale FormGroup (rating, comment)
 * - Auto-save on value changes
 * - Patch methods for pre-filling from drafts
 * - Reset methods
 *
 * @example
 * ```typescript
 * @Component({...})
 * export class TastingPageComponent {
 *   formService = inject(TastingFormService);
 *
 *   // Access forms in template
 *   quickForm = this.formService.quickForm;
 *   finaleForm = this.formService.finaleForm;
 *
 *   // Patch from draft
 *   this.formService.patchQuickData({
 *     cigar: draft.cigarId,
 *     situation: draft.situation,
 *   });
 * }
 * ```
 */
@Injectable()
export class TastingFormService implements OnDestroy {
  readonly #fb = inject(FormBuilder);
  readonly #autoSave = inject(TastingAutoSaveService);

  #subscriptions: Subscription[] = [];

  /**
   * Phase Quick FormGroup
   * Captures: date, moment, cigar, situation, pairing, pairingNote
   */
  readonly quickForm = this.#fb.nonNullable.group({
    date: [new Date().toISOString()],
    moment: [this.#calculateMoment() as TastingMoment],
    cigar: new FormControl<string>('', { validators: Validators.required, nonNullable: true }),
    situation: new FormControl<TastingSituation | null>(null),
    pairing: new FormControl<PairingType | null>(null),
    pairingNote: [''],
  });

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
    // Auto-save Quick form on value changes
    // No debounce here - TastingAutoSaveService already handles debouncing
    const quickSub = this.quickForm.valueChanges.subscribe(() => {
      this.#saveQuickData();
    });

    // Subscribe to rating changes to update reactive signal
    const ratingSub = this.finaleForm.controls.rating.valueChanges.subscribe(rating => {
      this.ratingSignal.set(rating);
    });

    // NOTE: Finale form is NOT auto-saved
    // Rating and comment are only saved when completing tasting via getCompleteTastingData()

    this.#subscriptions.push(quickSub, ratingSub);
  }

  /**
   * Save Quick form data via auto-save service
   * NOTE: Date is NOT saved here (auto-generated on creation, immutable)
   */
  #saveQuickData(): void {
    const value = this.quickForm.getRawValue();

    // Only save if cigar is selected (required field)
    if (!value.cigar) return;

    this.#autoSave.saveTastingData({
      moment: value.moment,
      cigarId: value.cigar,
      situation: value.situation ?? undefined,
      pairing: value.pairing ?? undefined,
      pairingNote: value.pairingNote || undefined,
    });
  }

  /**
   * Patch Quick form data (pre-fill from draft)
   */
  patchQuickData(data: Partial<QuickFormValue>): void {
    this.quickForm.patchValue(data, { emitEvent: false });
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
   * Reset Quick form (with fresh date/moment)
   */
  resetQuickForm(): void {
    this.quickForm.reset({
      date: new Date().toISOString(),
      moment: this.#calculateMoment(),
      cigar: '',
      situation: null,
      pairing: null,
      pairingNote: '',
    });
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
   * Reset all forms
   */
  resetAll(): void {
    this.resetQuickForm();
    this.resetFinaleForm();
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
   * Calculate current moment based on time of day
   * Returns API-aligned value (uppercase)
   */
  #calculateMoment(): TastingMoment {
    const hour = new Date().getHours();
    if (hour < 12) return 'MATIN';
    if (hour < 18) return 'APRES_MIDI';
    return 'SOIR';
  }

  /**
   * Force flush pending saves (on component destroy)
   */
  async flush(): Promise<void> {
    await this.#autoSave.flush();
  }

  /**
   * Cleanup subscriptions
   */
  ngOnDestroy(): void {
    this.#subscriptions.forEach(sub => sub.unsubscribe());
  }
}
