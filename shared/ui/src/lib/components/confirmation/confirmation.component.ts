import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconDirective, type IconName } from '../../directives/icon';
import { ButtonComponent } from '../button';

/**
 * Confirmation Component
 *
 * Success screen with customizable message and action buttons
 * Used after successful creation/update operations
 *
 * ALL STARS Architecture ⭐
 * - Reusable for any confirmation flow
 * - Customizable icon, message, buttons
 * - Elegant animation on appear
 * - Theme-aware design
 *
 * Features:
 * - Icon with success animation
 * - Custom message
 * - Primary action button (prominent)
 * - Secondary action button (subtle)
 * - Auto-focus on primary button
 *
 * @example
 * ```html
 * <ui-confirmation
 *   icon="check-circle"
 *   [message]="'Félicitations, Cohiba Behike 52 a été ajouté à la cave'"
 *   primaryLabel="🔥 Déguster maintenant"
 *   [primaryIcon]="'flame'"
 *   secondaryLabel="Consulter la fiche"
 *   [secondaryIcon]="'eye'"
 *   (primaryAction)="handleStartTasting()"
 *   (secondaryAction)="handleViewCigar()"
 * />
 * ```
 */

const CLASSES = {
  container: 'flex flex-col items-center justify-center py-8 px-6 text-center space-y-6',
  icon: {
    wrapper: 'flex items-center justify-center w-16 h-16 rounded-full bg-gold-500/10 animate-scale-in',
    svg: 'w-10 h-10 text-gold-500',
  },
  message: 'text-lg font-medium text-smoke-100 max-w-md',
  actions: 'flex flex-col gap-3 w-full max-w-sm',
} as const;

@Component({
  selector: 'ui-confirmation',
  standalone: true,
  imports: [CommonModule, IconDirective, ButtonComponent],
  templateUrl: './confirmation.component.html',
  styleUrls: ['./confirmation.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmationComponent {
  // Inputs
  readonly icon = input<IconName>('check-circle');
  readonly message = input.required<string>();
  readonly primaryLabel = input.required<string>();
  readonly primaryIcon = input<IconName | undefined>();
  readonly secondaryLabel = input<string>('');
  readonly secondaryIcon = input<IconName | undefined>();

  // Outputs
  readonly primaryAction = output<void>();
  readonly secondaryAction = output<void>();

  // Class constants (expose for template)
  readonly CLASSES = CLASSES;

  handlePrimaryClick(): void {
    this.primaryAction.emit();
  }

  handleSecondaryClick(): void {
    this.secondaryAction.emit();
  }
}
