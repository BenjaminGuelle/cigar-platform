import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconDirective } from '../../directives/icon';
import { ButtonComponent } from '../button';
import { ModalComponent } from '../modal';

/**
 * Coming Soon Modal Component
 * Generic modal for features not yet implemented
 *
 * Uses base ModalComponent for consistent animations and UX
 *
 * @example
 * ```html
 * <ui-coming-soon-modal
 *   [isOpen]="modalOpen()"
 *   [featureName]="'Cave'"
 *   (close)="modalOpen.set(false)"
 * />
 * ```
 */
@Component({
  selector: 'ui-coming-soon-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, IconDirective, ButtonComponent, ModalComponent],
  template: `
    <ui-modal
      [isOpen]="isOpen()"
      size="sm"
      position="centered"
      [showCloseButton]="false"
      (close)="close.emit()"
    >
      <!-- Header -->
      <div class="mb-6 text-center">
        <h2 id="modal-title" class="text-2xl font-display text-smoke-50 mb-2">
          {{ featureName() || 'Fonctionnalité' }}
        </h2>
        <p class="text-sm text-smoke-400">
          Arrive prochainement
        </p>
      </div>

      <!-- Content -->
      <div class="text-center mb-6">
        <div class="mb-4 flex justify-center">
          <div class="w-16 h-16 rounded-full bg-gold-500/10 flex items-center justify-center">
            <i name="calendar" class="w-8 h-8 text-gold-500"></i>
          </div>
        </div>

        <p class="text-smoke-300 mb-2">
          Cette fonctionnalité est en cours de développement.
        </p>
        <p class="text-sm text-smoke-400">
          Nous travaillons activement pour vous offrir la meilleure expérience possible.
        </p>
      </div>

      <!-- Footer -->
      <ui-button
        variant="primary"
        [fullWidth]="true"
        (clicked)="close.emit()"
      >
        J'ai compris
      </ui-button>
    </ui-modal>
  `,
})
export class ComingSoonModalComponent {
  readonly isOpen = input<boolean>(false);
  readonly featureName = input<string>('Fonctionnalité');
  readonly close = output<void>();
}
