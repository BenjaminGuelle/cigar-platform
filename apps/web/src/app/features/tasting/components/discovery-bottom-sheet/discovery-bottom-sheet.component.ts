import { Component, input, output } from '@angular/core';
import { ModalComponent } from '@cigar-platform/shared/ui';
import { ButtonComponent } from '@cigar-platform/shared/ui';
import { IconDirective } from '@cigar-platform/shared/ui';

/**
 * Discovery Bottom Sheet Component
 * Shown to Free users when they click "Approfondir la chronique"
 *
 * Uses ui-modal (bottomSheet variant) for consistent UX with:
 * - Swipe-to-dismiss on mobile
 * - Smooth animations
 * - Backdrop click to close
 *
 * Explains:
 * - What Discovery Mode is (explore without saving)
 * - Benefits of Premium (save observations, build taster profile)
 *
 * CTAs:
 * - "Découvrir quand même" → Continue in discovery mode
 * - "Devenir Premium" → Upgrade flow
 *
 * @example
 * ```html
 * <app-discovery-bottom-sheet
 *   [isOpen]="showDiscoveryBottomSheet()"
 *   (close)="handleDiscoveryClose()"
 *   (discover)="handleDiscoveryConfirm()"
 *   (upgradePremium)="handleUpgradePremium()"
 * />
 * ```
 */
@Component({
  selector: 'app-discovery-bottom-sheet',
  standalone: true,
  imports: [ModalComponent, ButtonComponent, IconDirective],
  template: `
    <ui-modal
      [isOpen]="isOpen()"
      variant="bottomSheet"
      size="md"
      desktopPosition="centered"
      [showCloseButton]="false"
      (close)="close.emit()"
    >
      <!-- Icon -->
      <div class="flex justify-center mb-4">
        <div class="w-12 h-12 rounded-full bg-gold-500/10 flex items-center justify-center">
          <i name="info" class="w-6 h-6 text-gold-500"></i>
        </div>
      </div>

      <!-- Title -->
      <h2 class="text-2xl font-display text-gold-500 text-center mb-4">
        Mode Découverte
      </h2>

      <!-- Description -->
      <div class="space-y-4 mb-6 text-center">
        <p class="text-smoke-200 leading-relaxed">
          Explorez les analyses avancées pour enrichir votre expérience de dégustation.
        </p>

        <div class="p-4 bg-gold-500/10 border-l-3 border-gold-500 rounded-md text-left">
          <p class="text-sm text-smoke-200 flex items-start gap-2">
            <span class="text-gold-500 flex-shrink-0">✨</span>
            <span>
              <strong class="text-smoke-50">Note</strong> : En mode Découverte, vos observations ne seront pas sauvegardées.
            </span>
          </p>
        </div>

        <p class="text-sm text-smoke-300">
          Avec <strong class="text-gold-500">Premium</strong>, vos analyses sont conservées et enrichissent votre profil de dégustateur.
        </p>
      </div>

      <!-- CTAs -->
      <div class="flex flex-col gap-3">
        <ui-button
          variant="primary"
          [fullWidth]="true"
          (clicked)="upgradePremium.emit()"
        >
          Devenir Premium
        </ui-button>

        <ui-button
          variant="outline"
          [fullWidth]="true"
          (clicked)="discover.emit()"
        >
          Découvrir quand même
        </ui-button>
      </div>
    </ui-modal>
  `,
})
export class DiscoveryBottomSheetComponent {
  /**
   * Control visibility from parent
   */
  isOpen = input<boolean>(false);

  /**
   * Emitted when user closes the bottom sheet (clicks backdrop or swipes down)
   */
  close = output<void>();

  /**
   * Emitted when user clicks "Découvrir quand même"
   */
  discover = output<void>();

  /**
   * Emitted when user clicks "Devenir Premium"
   */
  upgradePremium = output<void>();
}