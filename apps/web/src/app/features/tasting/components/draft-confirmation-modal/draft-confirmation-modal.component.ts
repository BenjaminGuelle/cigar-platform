import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalComponent, IconDirective, ButtonComponent } from '@cigar-platform/shared/ui';
import type { TastingResponseDto } from '@cigar-platform/types';

/**
 * Draft Confirmation Modal Component
 * Modal pour confirmer la reprise ou suppression d'un draft existant
 *
 * ALL STARS Architecture ⭐
 * - Affiche le cigare et la date du draft
 * - Texte clair et poétique
 * - Actions: Continuer / Nouveau tasting
 *
 * Usage:
 * ```html
 * <app-draft-confirmation-modal
 *   [isOpen]="showDraftModal()"
 *   [draft]="existingDraft()"
 *   (continue)="handleContinueDraft()"
 *   (newTasting)="handleNewTasting()"
 *   (close)="showDraftModal.set(false)"
 * />
 * ```
 */
@Component({
  selector: 'app-draft-confirmation-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent, IconDirective, ButtonComponent],
  template: `
    <ui-modal
      [isOpen]="isOpen()"
      size="sm"
      variant="dialog"
      [showCloseButton]="true"
      (close)="close.emit()"
    >
      <div class="flex flex-col gap-6 p-6">
        <!-- Header -->
        <div class="flex flex-col gap-2 text-center">
          <h2 class="text-2xl font-display text-gold-500 tracking-wide">
            Un Rituel Inachevé
          </h2>
          <p class="text-sm text-smoke-400 italic">
            Voulez-vous reprendre où vous vous êtes arrêté ?
          </p>
        </div>

        <!-- Draft Info -->
        @if (draft()) {
          <div class="flex flex-col gap-3 p-4 bg-smoke-900/30 border border-smoke-800 rounded-lg">
            <!-- Cigar Name -->
            <div class="flex items-center gap-3">
              <i name="flame" class="w-5 h-5 text-gold-500 flex-shrink-0"></i>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-smoke-200 truncate">
                  {{ cigarName() }}
                </p>
                @if (brandName()) {
                  <p class="text-xs text-smoke-500">
                    {{ brandName() }}
                  </p>
                }
              </div>
            </div>

            <!-- Date -->
            <div class="flex items-center gap-3">
              <i name="calendar" class="w-5 h-5 text-smoke-500 flex-shrink-0"></i>
              <p class="text-xs text-smoke-400">
                {{ formattedDate() }}
              </p>
            </div>
          </div>
        }

        <!-- Actions -->
        <div class="flex flex-col gap-3">
          <!-- Continuer -->
          <ui-button
            variant="primary"
            fullWidth
            (clicked)="continue.emit()"
          >
            Reprendre le Rituel
          </ui-button>

          <!-- Nouveau -->
          <ui-button
            variant="outline"
            fullWidth
            (clicked)="newTasting.emit()"
          >
            Nouveau Rituel
          </ui-button>
        </div>

        <!-- Note -->
        <p class="text-xs text-smoke-600 text-center">
          Un nouveau rituel supprimera le brouillon en cours
        </p>
      </div>
    </ui-modal>
  `,
})
export class DraftConfirmationModalComponent {
  isOpen = input.required<boolean>();
  draft = input<TastingResponseDto | null>(null);

  continue = output<void>();
  newTasting = output<void>();
  close = output<void>();

  // Computed values
  readonly cigarName = computed(() => this.draft()?.cigar?.name || 'Cigare inconnu');
  readonly brandName = computed(() => this.draft()?.cigar?.brand?.name || null);
  readonly formattedDate = computed(() => {
    const date = this.draft()?.date;
    if (!date) return '';

    const d = new Date(date);
    return d.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    });
  });
}
