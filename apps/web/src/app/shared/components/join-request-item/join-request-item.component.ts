import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import type { ClubJoinRequestResponseDto } from '@cigar-platform/types';
import { AvatarComponent, type AvatarUser, ButtonComponent, IconDirective } from '@cigar-platform/shared/ui';

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
  imports: [CommonModule, RouterLink, AvatarComponent, ButtonComponent, IconDirective],
  template: `
    <div class="flex items-center justify-between py-3 px-4 hover:bg-white/[0.02] transition-colors group">
      <!-- Left: Avatar + User info + Message + Date -->
      <div class="flex items-center gap-4 flex-1 min-w-0">
        <a
          [routerLink]="['/user', request().user.id]"
          class="flex items-center gap-4 group/link">
          <ui-avatar
            [user]="avatarUser()"
            size="sm" />

          <div class="flex flex-col gap-0.5">
            <!-- Name -->
            <span class="text-sm font-medium text-white group-hover/link:text-gold-400 group-hover/link:underline transition-colors">
              {{ request().user.displayName }}
            </span>

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
        </a>
      </div>

      <!-- Right: Action buttons (Icon only) -->
      <div class="flex items-center gap-2 ml-4 shrink-0">
        <!-- Approve button -->
        <ui-button
          (clicked)="approve.emit(request())"
          variant="success"
          size="icon"
          icon="check"
          [loading]="isApproving()"
          [disabled]="isProcessing()">
          <span class="sr-only">Approuver</span>
        </ui-button>
        <!-- Reject button -->
        <ui-button
          (clicked)="reject.emit(request())"
          variant="ghost"
          size="icon"
          icon="x"
          customClass="!text-red-500 hover:!text-red-400 hover:bg-red-500/10"
          [loading]="isRejecting()"
          [disabled]="isProcessing()">
          <span class="sr-only">Rejeter</span>
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

  // Computed: User for Avatar component (type-safe)
  readonly avatarUser = computed((): AvatarUser => ({
    id: this.request().user.id,
    displayName: this.request().user.displayName,
    avatarUrl: this.request().user.avatarUrl,
  }));

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
