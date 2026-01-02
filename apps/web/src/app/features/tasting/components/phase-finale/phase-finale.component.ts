import { Component, output, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RatingBandsComponent } from '@cigar-platform/shared/ui';
import { TastingFormService } from '../../services/tasting-form.service';
import type { Subscription } from 'rxjs';

/**
 * Phase Finale Component
 * "Le Dernier Mot" - Notation et commentaire final
 *
 * ALL STARS Architecture ⭐
 * - Design premium avec bagues de cigare
 * - Vibration haptique
 * - Wording poétique
 *
 * Captures:
 * - Rating (0.5-5, required)
 * - Comment (optional, 1000 chars max)
 */
@Component({
  selector: 'app-phase-finale',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RatingBandsComponent],
  template: `
    <div class="flex flex-col gap-12 items-center justify-center">
      <!-- Hero Section -->
      <div class="flex flex-col items-center gap-6 text-center">
        <p class="text-lg md:text-xl text-smoke-300 italic max-w-md font-light tracking-wide">
          Le feu s'éteint, l'expérience est gravée.
        </p>
      </div>

      <!-- Rating Section -->
      <div class="flex flex-col items-center gap-6">
        <h3 class="text-base font-display text-gold-500 tracking-wide">
          Le Sceau de l'Excellence
        </h3>

        <ui-rating-bands
          [value]="finaleForm.controls.rating.value"
          (valueChange)="handleRatingChange($event)"
        />
      </div>

      <!-- Comment Section -->
      <div class="w-full max-w-2xl flex flex-col gap-3">
        <label class="text-sm font-display text-gold-500/80 tracking-wide">
          Confidences de fumée
        </label>
        <textarea
          [formControl]="finaleForm.controls.comment"
          placeholder="Partagez vos impressions..."
          rows="4"
          maxlength="1000"
          class="w-full px-4 py-3 bg-smoke-900/30 text-smoke-200 placeholder:text-smoke-500 border-2 border-smoke-800 rounded-lg focus:border-gold-500/50 focus:ring-2 focus:ring-gold-500/10 focus:outline-none transition-all duration-200 resize-none font-light text-base"
        ></textarea>
        @if (finaleForm.controls.comment.value.length > 0) {
          <p class="text-xs text-smoke-600 text-right">
            {{ finaleForm.controls.comment.value.length }} / 1000
          </p>
        }
      </div>
    </div>
  `,
})
export class PhaseFinaleComponent implements OnInit, OnDestroy {
  // Services
  readonly #formService = inject(TastingFormService);

  // Form (from TastingFormService)
  readonly finaleForm = this.#formService.finaleForm;

  // Subscriptions
  #subscriptions: Subscription[] = [];

  // Outputs
  dataChange = output<{
    rating: number;
    comment: string;
  }>();

  constructor() {
    // Listen to form changes and emit dataChange output
    const formSub = this.finaleForm.valueChanges.subscribe(() => {
      this.#emitChange();
    });

    this.#subscriptions.push(formSub);
  }

  ngOnInit(): void {
    // Auto-emit initial state
    this.#emitChange();
  }

  handleRatingChange(rating: number): void {
    this.finaleForm.controls.rating.setValue(rating);
  }

  #emitChange(): void {
    const value = this.finaleForm.getRawValue();
    this.dataChange.emit({
      rating: value.rating,
      comment: value.comment,
    });
  }

  ngOnDestroy(): void {
    this.#subscriptions.forEach(sub => sub.unsubscribe());
  }
}
