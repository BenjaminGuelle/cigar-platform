import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { ClubJoinRequestResponseDto } from '@cigar-platform/types';
import { ButtonComponent } from '@cigar-platform/shared/ui';

/**
 * Join Request Item Component
 *
 * Compact row-style display for club join requests with:
 * - User ID (truncated)
 * - Request message (if provided)
 * - Request date
 * - Approve/Reject buttons with independent loading states
 *
 * Features:
 * - OnPush change detection for performance
 * - Signal inputs/outputs (Angular 17+)
 * - Consistent design with member-item
 * - Independent loading states for approve/reject actions
 *
 * @example
 * ```html
 * <app-join-request-item
 *   [request]="request"
 *   [approvingRequestId]="processingRequestId()"
 *   [rejectingRequestId]="processingRequestId()"
 *   [processingAction]="processingAction()"
 *   (approve)="onApprove($event)"
 *   (reject)="onReject($event)"
 * />
 * ```
 */
@Component({
  selector: 'app-join-request-item',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ButtonComponent],
  template: `
    <div class="flex items-center justify-between py-3 px-4 hover:bg-white/[0.02] transition-colors group">
      <!-- Left: User info + Message + Date -->
      <div class="flex flex-col gap-0.5 flex-1 min-w-0">
        <!-- User ID + Badge -->
        <div class="flex items-center gap-3">
          <span class="text-sm font-medium text-white">
            Utilisateur {{ request().userId.substring(0, 8) }}...
          </span>
          <span class="text-[9px] uppercase tracking-wide px-1.5 py-0.5 rounded-full border font-medium bg-orange-500/10 border-orange-500/20 text-orange-400">
            En attente
          </span>
        </div>

        <!-- Message (if provided) -->
        @if (request().message) {
          <p class="text-xs text-smoke-400 italic line-clamp-1">
            "{{ request().message }}"
          </p>
        }

        <!-- Date -->
        <span class="text-xs text-smoke-300">
          Demandé le {{ formatDate(request().createdAt) }}
        </span>
      </div>

      <!-- Right: Action buttons -->
      <div class="flex items-center gap-2 ml-4 shrink-0">
        <ui-button
          (clicked)="approve.emit(request())"
          variant="primary"
          size="sm"
          [loading]="isApproving()"
          [disabled]="isProcessing()">
          Approuver
        </ui-button>
        <ui-button
          (clicked)="reject.emit(request())"
          variant="secondary"
          size="sm"
          [loading]="isRejecting()"
          [disabled]="isProcessing()">
          Rejeter
        </ui-button>
      </div>
    </div>
  `,
})
export class JoinRequestItemComponent {
  // Inputs
  readonly request = input.required<ClubJoinRequestResponseDto>();
  readonly processingRequestId = input<string | null>(null);
  readonly processingAction = input<'approve' | 'reject' | null>(null);

  // Outputs
  readonly approve = output<ClubJoinRequestResponseDto>();
  readonly reject = output<ClubJoinRequestResponseDto>();

  // Computed - Loading states for each button
  readonly isApproving = computed(() => {
    return this.processingRequestId() === this.request().id && this.processingAction() === 'approve';
  });

  readonly isRejecting = computed(() => {
    return this.processingRequestId() === this.request().id && this.processingAction() === 'reject';
  });

  readonly isProcessing = computed(() => {
    return this.processingRequestId() === this.request().id;
  });

  /**
   * Format date for display
   */
  formatDate(date: string | Date): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
}
