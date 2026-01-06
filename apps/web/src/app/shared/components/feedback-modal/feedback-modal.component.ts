import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
  inject,
  PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent, ButtonComponent, IconDirective } from '@cigar-platform/shared/ui';
import { FeedbackService as FeedbackApiService } from '@cigar-platform/types/lib/feedback/feedback.service';
import { CreateFeedbackDtoType } from '@cigar-platform/types';
import { PwaService } from '../../../core/services/pwa.service';
import { ToastService } from '../../../core/services/toast.service';
import type { IconName } from '@cigar-platform/shared/ui';

type FeedbackType = 'BUG' | 'FEATURE' | 'OTHER';

interface FeedbackTypeOption {
  value: FeedbackType;
  label: string;
  icon: IconName;
  description: string;
}

/**
 * Feedback Modal Component
 *
 * Allows users to submit feedback (bug reports, feature requests, other)
 *
 * @example
 * ```html
 * <app-feedback-modal
 *   [isOpen]="showFeedback()"
 *   (close)="showFeedback.set(false)"
 * />
 * ```
 */
@Component({
  selector: 'app-feedback-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, ModalComponent, ButtonComponent, IconDirective],
  template: `
    <ui-modal
      [isOpen]="isOpen()"
      size="sm"
      variant="dialog"
      (close)="onClose()"
    >
      <!-- Header -->
      <div class="mb-6">
        <h2 class="text-xl font-display text-smoke-50 mb-2">
          Donner mon avis
        </h2>
        <p class="text-sm text-smoke-400">
          Aidez-nous a ameliorer Cigar & Club
        </p>
      </div>

      <!-- Feedback Type Selection -->
      <div class="mb-6">
        <label class="block text-sm font-medium text-smoke-300 mb-3">
          Type de feedback
        </label>
        <div class="grid grid-cols-3 gap-2">
          @for (option of feedbackTypes; track option.value) {
            <button
              type="button"
              (click)="selectedType.set(option.value)"
              [class]="getTypeButtonClass(option.value)"
            >
              <i [name]="option.icon" class="w-5 h-5 mb-1"></i>
              <span class="text-xs">{{ option.label }}</span>
            </button>
          }
        </div>
      </div>

      <!-- Message -->
      <div class="mb-6">
        <label class="block text-sm font-medium text-smoke-300 mb-2">
          {{ getMessageLabel() }}
        </label>
        <textarea
          [(ngModel)]="message"
          [placeholder]="getMessagePlaceholder()"
          rows="4"
          class="w-full px-4 py-3 bg-smoke-800 border border-smoke-700 rounded-lg text-smoke-100 placeholder-smoke-500 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent resize-none"
        ></textarea>
        <p class="mt-1 text-xs text-smoke-500">
          {{ message().length }} / 2000 caracteres
        </p>
      </div>

      <!-- Actions -->
      <div class="flex items-center justify-end gap-3">
        <ui-button
          (click)="onClose()"
          variant="secondary"
          [disabled]="submitting()"
        >
          Annuler
        </ui-button>
        <ui-button
          (click)="onSubmit()"
          variant="primary"
          [loading]="submitting()"
          [disabled]="!canSubmit()"
        >
          Envoyer
        </ui-button>
      </div>
    </ui-modal>
  `,
})
export class FeedbackModalComponent {
  readonly #platformId = inject(PLATFORM_ID);
  readonly #feedbackApi = inject(FeedbackApiService);
  readonly #pwaService = inject(PwaService);
  readonly #toastService = inject(ToastService);

  // Inputs
  readonly isOpen = input<boolean>(false);

  // Outputs
  readonly close = output<void>();

  // State
  readonly selectedType = signal<FeedbackType>('FEATURE');
  readonly message = signal<string>('');
  readonly submitting = signal<boolean>(false);

  // Type options
  readonly feedbackTypes: FeedbackTypeOption[] = [
    {
      value: 'BUG',
      label: 'Bug',
      icon: 'alert-circle',
      description: 'Signaler un probleme',
    },
    {
      value: 'FEATURE',
      label: 'Idee',
      icon: 'sparkles',
      description: 'Suggerer une fonctionnalite',
    },
    {
      value: 'OTHER',
      label: 'Autre',
      icon: 'info',
      description: 'Autre feedback',
    },
  ];

  canSubmit(): boolean {
    return this.message().trim().length >= 10 && this.message().length <= 2000 && !this.submitting();
  }

  getTypeButtonClass(type: FeedbackType): string {
    const base = 'flex flex-col items-center justify-center p-3 rounded-lg border transition-all';
    const selected = this.selectedType() === type;

    if (selected) {
      return `${base} bg-gold-500/20 border-gold-500 text-gold-500`;
    }
    return `${base} bg-smoke-800 border-smoke-700 text-smoke-400 hover:border-smoke-600 hover:text-smoke-300`;
  }

  getMessageLabel(): string {
    switch (this.selectedType()) {
      case 'BUG':
        return 'Decrivez le probleme';
      case 'FEATURE':
        return 'Decrivez votre idee';
      default:
        return 'Votre message';
    }
  }

  getMessagePlaceholder(): string {
    switch (this.selectedType()) {
      case 'BUG':
        return 'Que s\'est-il passe ? Quand ? Sur quelle page ?';
      case 'FEATURE':
        return 'Quelle fonctionnalite aimeriez-vous voir ?';
      default:
        return 'Partagez vos pensees...';
    }
  }

  onClose(): void {
    this.close.emit();
    this.resetForm();
  }

  async onSubmit(): Promise<void> {
    if (!this.canSubmit()) return;

    this.submitting.set(true);

    try {
      const metadata = this.#collectMetadata();

      await this.#feedbackApi.feedbackControllerCreate({
        type: this.selectedType() as CreateFeedbackDtoType,
        message: this.message().trim(),
        page: isPlatformBrowser(this.#platformId) ? window.location.pathname : '/',
        metadata,
      });

      this.#toastService.success('Merci pour votre feedback !');
      this.close.emit();
      this.resetForm();
    } catch {
      this.#toastService.error('Erreur lors de l\'envoi du feedback');
    } finally {
      this.submitting.set(false);
    }
  }

  resetForm(): void {
    this.selectedType.set('FEATURE');
    this.message.set('');
    this.submitting.set(false);
  }

  #collectMetadata(): Record<string, unknown> {
    if (!isPlatformBrowser(this.#platformId)) {
      return {};
    }

    return {
      userAgent: navigator.userAgent,
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight,
      platform: this.#pwaService.platform(),
      isPwa: this.#pwaService.isStandalone(),
    };
  }
}
