import { Component, output, inject, OnInit, OnDestroy, signal, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RatingBandsComponent, ButtonComponent } from '@cigar-platform/shared/ui';
import { TastingFormService } from '../../services/tasting-form.service';
import type { Subscription } from 'rxjs';

/**
 * Phase Finale Component (Chat-Like)
 * "Le Dernier Mot" - Notation et commentaire final
 *
 * ALL STARS Architecture ⭐
 * - Chat-like sequential flow
 * - Design premium avec bagues de cigare
 *
 * Flow: Rating → Comment → Done
 */

type FinaleStep = 'rating' | 'comment' | 'done';

@Component({
  selector: 'app-phase-finale',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RatingBandsComponent, ButtonComponent],
  templateUrl: './phase-finale.component.html',
  styles: [`
    .question-step { animation: question-enter 0.25s ease-out; }
    @keyframes question-enter {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `],
})
export class PhaseFinaleComponent implements OnInit, OnDestroy {
  readonly #formService = inject(TastingFormService);
  readonly finaleForm = this.#formService.finaleForm;

  // Inputs
  isSubmitting = input<boolean>(false);

  currentStep = signal<FinaleStep>('rating');

  #subscriptions: Subscription[] = [];

  dataChange = output<{ rating: number; comment: string }>();
  complete = output<void>();

  constructor() {
    const formSub = this.finaleForm.valueChanges.subscribe(() => {
      this.#emitChange();
    });
    this.#subscriptions.push(formSub);
  }

  ngOnInit(): void {
    this.#emitChange();
  }

  handleRatingChange(rating: number): void {
    this.finaleForm.controls.rating.setValue(rating);
  }

  goToComment(): void { this.currentStep.set('comment'); }

  skipComment(): void {
    this.finaleForm.controls.comment.setValue('');
    this.goToDone();
  }

  goToDone(): void { this.currentStep.set('done'); }

  #emitChange(): void {
    const value = this.finaleForm.getRawValue();
    this.dataChange.emit({ rating: value.rating, comment: value.comment });
  }

  ngOnDestroy(): void {
    this.#subscriptions.forEach(sub => sub.unsubscribe());
  }
}
