import { Component, ChangeDetectionStrategy, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconDirective, ButtonComponent } from '@cigar-platform/shared/ui';
import { injectFeedbackStore, FeedbackStore } from '../../../core/stores/feedback.store';
import type { FeedbackResponseDto, UpdateFeedbackStatusDtoStatus } from '@cigar-platform/types';
import { ToastService } from '../../../core/services/toast.service';
import { inject } from '@angular/core';

type FeedbackStatus = 'NEW' | 'READ' | 'IN_PROGRESS' | 'RESOLVED' | 'WONT_FIX';
type FeedbackType = 'BUG' | 'FEATURE' | 'OTHER';

/**
 * Admin Feedbacks Component
 * List and manage user feedbacks
 */
@Component({
  selector: 'app-admin-feedbacks',
  standalone: true,
  imports: [CommonModule, IconDirective, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-6 md:p-8">
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-smoke-50 mb-2">Feedbacks</h1>
        <p class="text-smoke-400">Gerez les retours utilisateurs</p>
      </div>

      @if (feedbackStore.feedbacks.loading()) {
        <div class="flex items-center justify-center py-12">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-500"></div>
        </div>
      } @else if (feedbackStore.feedbacks.error()) {
        <div class="text-center py-12">
          <p class="text-error-500">Erreur lors du chargement des feedbacks</p>
          <ui-button variant="secondary" size="sm" class="mt-4" (click)="feedbackStore.feedbacks.invalidate()">
            Reessayer
          </ui-button>
        </div>
      } @else {
        <!-- Stats Summary -->
        <div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          @for (stat of statusStats(); track stat.status) {
            <div
              class="rounded-lg p-4 border cursor-pointer transition-all"
              [class]="selectedStatus() === stat.status
                ? 'bg-gold-500/10 border-gold-500'
                : 'bg-smoke-800 border-smoke-700 hover:border-smoke-600'"
              (click)="toggleStatusFilter(stat.status)"
            >
              <div class="flex items-center gap-2 mb-1">
                <span [class]="getStatusBadgeClass(stat.status)" class="w-2 h-2 rounded-full"></span>
                <span class="text-xs text-smoke-400">{{ getStatusLabel(stat.status) }}</span>
              </div>
              <p class="text-xl font-bold text-smoke-50">{{ stat.count }}</p>
            </div>
          }
        </div>

        <!-- Feedbacks List -->
        @if (filteredFeedbacks().length === 0) {
          <div class="text-center py-12 bg-smoke-800 rounded-lg border border-smoke-700">
            <i name="box" class="w-12 h-12 text-smoke-600 mx-auto mb-3"></i>
            <p class="text-smoke-400">Aucun feedback</p>
          </div>
        } @else {
          <div class="space-y-4">
            @for (feedback of filteredFeedbacks(); track feedback.id) {
              <div class="bg-smoke-800 rounded-lg border border-smoke-700 p-4">
                <!-- Header -->
                <div class="flex items-start justify-between mb-3">
                  <div class="flex items-center gap-3">
                    <span [class]="getTypeBadgeClass(feedback.type)">
                      {{ getTypeLabel(feedback.type) }}
                    </span>
                    <span [class]="getStatusBadge(feedback.status)">
                      {{ getStatusLabel(feedback.status) }}
                    </span>
                  </div>
                  <span class="text-xs text-smoke-500">
                    {{ formatDate(feedback.createdAt) }}
                  </span>
                </div>

                <!-- Message -->
                <p class="text-smoke-200 mb-3 whitespace-pre-wrap">{{ feedback.message }}</p>

                <!-- Metadata -->
                <div class="flex flex-wrap items-center gap-4 text-xs text-smoke-500 mb-4">
                  <span class="flex items-center gap-1">
                    <i name="user" class="w-3 h-3"></i>
                    {{ feedback.user?.username || 'Anonyme' }}
                  </span>
                  <span class="flex items-center gap-1">
                    <i name="book-open" class="w-3 h-3"></i>
                    {{ feedback.page }}
                  </span>
                  @if (feedback.metadata) {
                    <span class="flex items-center gap-1">
                      <i name="globe" class="w-3 h-3"></i>
                      {{ getPlatform(feedback.metadata) }}
                    </span>
                  }
                </div>

                <!-- Actions -->
                <div class="flex flex-wrap gap-2">
                  @for (action of getAvailableActions(feedback.status); track action.status) {
                    <ui-button
                      [variant]="action.variant"
                      size="sm"
                      [loading]="updatingId() === feedback.id"
                      [disabled]="updatingId() === feedback.id"
                      (click)="updateStatus(feedback.id, action.status)"
                    >
                      {{ action.label }}
                    </ui-button>
                  }
                </div>
              </div>
            }
          </div>

          <!-- Pagination -->
          @if (feedbackStore.totalPages() > 1) {
            <div class="mt-6 flex items-center justify-between">
              <span class="text-sm text-smoke-500">
                {{ feedbackStore.feedbacks.data()?.meta?.total ?? 0 }} feedbacks au total
              </span>

              <div class="flex items-center gap-2">
                <ui-button
                  variant="secondary"
                  size="sm"
                  [disabled]="!feedbackStore.hasPrevPage() || feedbackStore.feedbacks.loading()"
                  (click)="feedbackStore.prevPage()"
                >
                  <i name="chevron-left" class="w-4 h-4"></i>
                </ui-button>

                <span class="text-sm text-smoke-300 px-2">
                  Page {{ feedbackStore.currentPage() }} / {{ feedbackStore.totalPages() }}
                </span>

                <ui-button
                  variant="secondary"
                  size="sm"
                  [disabled]="!feedbackStore.hasNextPage() || feedbackStore.feedbacks.loading()"
                  (click)="feedbackStore.nextPage()"
                >
                  <i name="chevron-right" class="w-4 h-4"></i>
                </ui-button>
              </div>
            </div>
          }
        }
      }
    </div>
  `,
})
export class FeedbacksComponent {
  readonly feedbackStore: FeedbackStore = injectFeedbackStore();
  readonly #toastService = inject(ToastService);

  readonly selectedStatus = signal<FeedbackStatus | null>(null);
  readonly updatingId = signal<string | null>(null);

  readonly feedbacks = computed(() => {
    return this.feedbackStore.feedbacks.data()?.data ?? [];
  });

  readonly filteredFeedbacks = computed(() => {
    const status = this.selectedStatus();
    const all = this.feedbacks();
    if (!status) return all;
    return all.filter((f) => f.status === status);
  });

  readonly statusStats = computed(() => {
    const all = this.feedbacks();
    const statuses: FeedbackStatus[] = ['NEW', 'READ', 'IN_PROGRESS', 'RESOLVED', 'WONT_FIX'];
    return statuses.map((status) => ({
      status,
      count: all.filter((f) => f.status === status).length,
    }));
  });

  toggleStatusFilter(status: FeedbackStatus): void {
    if (this.selectedStatus() === status) {
      this.selectedStatus.set(null);
    } else {
      this.selectedStatus.set(status);
    }
  }

  async updateStatus(id: string, status: FeedbackStatus): Promise<void> {
    this.updatingId.set(id);

    try {
      await this.feedbackStore.updateStatus.mutate({
        id,
        data: { status: status as UpdateFeedbackStatusDtoStatus },
      });
      this.#toastService.success('Statut mis a jour');
    } catch {
      this.#toastService.error('Erreur lors de la mise a jour');
    } finally {
      this.updatingId.set(null);
    }
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      NEW: 'Nouveau',
      READ: 'Lu',
      IN_PROGRESS: 'En cours',
      RESOLVED: 'Resolu',
      WONT_FIX: 'Ignore',
    };
    return labels[status] || status;
  }

  getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      BUG: 'Bug',
      FEATURE: 'Idee',
      OTHER: 'Autre',
    };
    return labels[type] || type;
  }

  getStatusBadgeClass(status: string): string {
    const classes: Record<string, string> = {
      NEW: 'bg-blue-500',
      READ: 'bg-smoke-500',
      IN_PROGRESS: 'bg-gold-500',
      RESOLVED: 'bg-green-500',
      WONT_FIX: 'bg-smoke-600',
    };
    return classes[status] || 'bg-smoke-500';
  }

  getStatusBadge(status: string): string {
    const base = 'px-2 py-0.5 rounded text-xs font-medium';
    const variants: Record<string, string> = {
      NEW: 'bg-blue-500/20 text-blue-400',
      READ: 'bg-smoke-600 text-smoke-300',
      IN_PROGRESS: 'bg-gold-500/20 text-gold-500',
      RESOLVED: 'bg-green-500/20 text-green-400',
      WONT_FIX: 'bg-smoke-700 text-smoke-400',
    };
    return `${base} ${variants[status] || 'bg-smoke-600 text-smoke-400'}`;
  }

  getTypeBadgeClass(type: string): string {
    const base = 'px-2 py-0.5 rounded text-xs font-medium';
    const variants: Record<string, string> = {
      BUG: 'bg-error-500/20 text-error-400',
      FEATURE: 'bg-gold-500/20 text-gold-500',
      OTHER: 'bg-smoke-600 text-smoke-300',
    };
    return `${base} ${variants[type] || 'bg-smoke-600 text-smoke-400'}`;
  }

  getAvailableActions(
    currentStatus: string
  ): Array<{ status: FeedbackStatus; label: string; variant: 'secondary' | 'primary' | 'destructive' }> {
    const actions: Record<string, Array<{ status: FeedbackStatus; label: string; variant: 'secondary' | 'primary' | 'destructive' }>> = {
      NEW: [
        { status: 'READ', label: 'Marquer lu', variant: 'secondary' },
        { status: 'IN_PROGRESS', label: 'Prendre en charge', variant: 'primary' },
      ],
      READ: [
        { status: 'IN_PROGRESS', label: 'Prendre en charge', variant: 'primary' },
        { status: 'WONT_FIX', label: 'Ignorer', variant: 'destructive' },
      ],
      IN_PROGRESS: [
        { status: 'RESOLVED', label: 'Resolu', variant: 'primary' },
        { status: 'WONT_FIX', label: 'Ignorer', variant: 'destructive' },
      ],
      RESOLVED: [],
      WONT_FIX: [{ status: 'NEW', label: 'Reouvrir', variant: 'secondary' }],
    };
    return actions[currentStatus] || [];
  }

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  getPlatform(metadata: unknown): string {
    if (metadata && typeof metadata === 'object' && 'platform' in metadata) {
      return String((metadata as { platform?: string }).platform) || 'unknown';
    }
    return 'unknown';
  }
}
