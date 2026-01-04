import { Component, input, output } from '@angular/core';
import { ModalComponent } from '@cigar-platform/shared/ui';
import { ButtonComponent } from '@cigar-platform/shared/ui';
import { IconDirective } from '@cigar-platform/shared/ui';

/**
 * Discovery Bottom Sheet Component
 * Shown to Free users when they click "Explorer la chronique"
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
 * 3 CTAs:
 * - "Devenir Premium" → Upgrade flow
 * - "J'ai compris, explorer" → Continue in discovery mode
 * - "Sceller le verdict" → Return to verdict (go to finale)
 *
 * @example
 * ```html
 * <app-discovery-bottom-sheet
 *   [isOpen]="showDiscoveryBottomSheet()"
 *   (close)="handleDiscoveryClose()"
 *   (discover)="handleDiscoveryConfirm()"
 *   (upgradePremium)="handleUpgradePremium()"
 *   (goToVerdict)="handleGoToVerdict()"
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
          <i name="eye" class="w-6 h-6 text-gold-500"></i>
        </div>
      </div>

      <!-- Title -->
      <h2 class="text-2xl font-display text-gold-500 text-center mb-4">
        Mode Découverte
      </h2>

      <!-- Description -->
      <div class="space-y-4 mb-6 text-center">
        <p class="text-smoke-200 leading-relaxed">
          Explore la chronique complète. Ces notes ne seront pas sauvegardées,
          mais tu vas découvrir la profondeur du rituel.
        </p>

        <div class="p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg text-left">
          <p class="text-sm text-smoke-300 flex items-start gap-3">
            <span class="text-gold-500 flex-shrink-0 mt-0.5">✨</span>
            <span>
              Avec <strong class="text-gold-400">Premium</strong>, tes analyses sont conservées
              et enrichissent ton profil de dégustateur.
            </span>
          </p>
        </div>
      </div>

      <!-- 3 CTAs -->
      <div class="flex flex-col gap-3">
        <!-- CTA 1: Upgrade Premium -->
        <ui-button
          variant="primary"
          [fullWidth]="true"
          (clicked)="upgradePremium.emit()"
        >
          Devenir Premium
        </ui-button>

        <!-- CTA 2: Continue in Discovery Mode -->
        <ui-button
          variant="outline"
          [fullWidth]="true"
          (clicked)="discover.emit()"
        >
          J'ai compris, explorer
        </ui-button>

        <!-- CTA 3: Return to Verdict -->
        <button
          type="button"
          (click)="goToVerdict.emit()"
          class="py-3 text-sm text-smoke-400 hover:text-smoke-200 transition-colors italic"
        >
          Sceller le verdict
        </button>
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
   * Emitted when user clicks "J'ai compris, explorer"
   */
  discover = output<void>();

  /**
   * Emitted when user clicks "Devenir Premium"
   */
  upgradePremium = output<void>();

  /**
   * Emitted when user clicks "Sceller le verdict"
   */
  goToVerdict = output<void>();
}