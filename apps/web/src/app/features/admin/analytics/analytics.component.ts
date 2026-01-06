import { Component, ChangeDetectionStrategy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconDirective, ButtonComponent } from '@cigar-platform/shared/ui';
import { injectAdminAnalyticsStore, type AdminAnalyticsStore } from '../../../core/stores/admin-analytics.store';
import type { AnalyticsEventResponseDto } from '@cigar-platform/types';

/**
 * Admin Analytics Component
 * View platform stats and analytics events list
 */
@Component({
  selector: 'app-admin-analytics',
  standalone: true,
  imports: [CommonModule, IconDirective, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-6 md:p-8">
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-smoke-50 mb-2">Analytics</h1>
        <p class="text-smoke-400">Statistiques et evenements de la plateforme</p>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div class="bg-smoke-800 rounded-lg p-4 border border-smoke-700">
          <div class="flex items-center gap-3 mb-2">
            <div class="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
              <i name="users" class="w-5 h-5 text-blue-400"></i>
            </div>
            <span class="text-smoke-400 text-sm">Utilisateurs</span>
          </div>
          <p class="text-2xl font-bold text-smoke-50">
            @if (analyticsStore.stats.loading()) {
              <span class="animate-pulse">...</span>
            } @else {
              {{ stats()?.totalUsers ?? 0 }}
            }
          </p>
        </div>

        <div class="bg-smoke-800 rounded-lg p-4 border border-smoke-700">
          <div class="flex items-center gap-3 mb-2">
            <div class="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
              <i name="users" class="w-5 h-5 text-purple-400"></i>
            </div>
            <span class="text-smoke-400 text-sm">Clubs</span>
          </div>
          <p class="text-2xl font-bold text-smoke-50">
            @if (analyticsStore.stats.loading()) {
              <span class="animate-pulse">...</span>
            } @else {
              {{ stats()?.totalClubs ?? 0 }}
            }
          </p>
        </div>

        <div class="bg-smoke-800 rounded-lg p-4 border border-smoke-700">
          <div class="flex items-center gap-3 mb-2">
            <div class="w-10 h-10 rounded-full bg-gold-500/20 flex items-center justify-center">
              <i name="flame" class="w-5 h-5 text-gold-500"></i>
            </div>
            <span class="text-smoke-400 text-sm">Degustations</span>
          </div>
          <p class="text-2xl font-bold text-smoke-50">
            @if (analyticsStore.stats.loading()) {
              <span class="animate-pulse">...</span>
            } @else {
              {{ stats()?.totalTastings ?? 0 }}
            }
          </p>
        </div>

        <div class="bg-smoke-800 rounded-lg p-4 border border-smoke-700">
          <div class="flex items-center gap-3 mb-2">
            <div class="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
              <i name="star" class="w-5 h-5 text-green-400"></i>
            </div>
            <span class="text-smoke-400 text-sm">Evenements</span>
          </div>
          <p class="text-2xl font-bold text-smoke-50">
            @if (analyticsStore.stats.loading()) {
              <span class="animate-pulse">...</span>
            } @else {
              {{ stats()?.totalEvents ?? 0 }}
            }
          </p>
        </div>
      </div>

      <!-- Events List -->
      @if (analyticsStore.events.loading()) {
        <div class="flex items-center justify-center py-12">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-500"></div>
        </div>
      } @else if (analyticsStore.events.error()) {
        <div class="text-center py-12">
          <p class="text-error-500">Erreur lors du chargement des evenements</p>
          <ui-button variant="secondary" size="sm" class="mt-4" (click)="analyticsStore.events.invalidate()">
            Reessayer
          </ui-button>
        </div>
      } @else {
        <div class="bg-smoke-800 rounded-lg border border-smoke-700 overflow-hidden">
          <!-- Header -->
          <div class="grid grid-cols-12 gap-4 px-4 py-3 bg-smoke-850 border-b border-smoke-700 text-sm font-medium text-smoke-400">
            <div class="col-span-1"></div>
            <div class="col-span-3">Evenement</div>
            <div class="col-span-3">Utilisateur</div>
            <div class="col-span-2">Page</div>
            <div class="col-span-2">Plateforme</div>
            <div class="col-span-1 text-right">Date</div>
          </div>

          <!-- Events -->
          @if ((events()?.length ?? 0) === 0) {
            <div class="text-center py-12 text-smoke-500">Aucun evenement</div>
          } @else {
            @for (event of events(); track event.id) {
              <!-- Event Row -->
              <div
                class="border-b border-smoke-700 last:border-b-0 cursor-pointer hover:bg-smoke-750 transition-colors"
                (click)="analyticsStore.toggleExpand(event.id)"
              >
                <div class="grid grid-cols-12 gap-4 px-4 py-3 items-center">
                  <div class="col-span-1">
                    <i
                      [name]="analyticsStore.isExpanded(event.id) ? 'chevron-down' : 'chevron-right'"
                      class="w-4 h-4 text-smoke-500 transition-transform"
                    ></i>
                  </div>
                  <div class="col-span-3">
                    <span class="font-mono text-sm" [class]="getEventColor(event.event)">
                      {{ event.event }}
                    </span>
                  </div>
                  <div class="col-span-3">
                    <div class="flex items-center gap-2">
                      @if (event.user) {
                        <div class="w-6 h-6 rounded-full bg-smoke-600 flex items-center justify-center overflow-hidden">
                          @if (event.user.avatarUrl) {
                            <img [src]="event.user.avatarUrl" class="w-full h-full object-cover" />
                          } @else {
                            <span class="text-xs text-smoke-300">{{ event.user.displayName?.charAt(0) ?? '?' }}</span>
                          }
                        </div>
                        <span class="text-smoke-200 text-sm truncate">{{ event.user.displayName ?? event.user.username }}</span>
                      } @else {
                        <span class="text-smoke-500 text-sm">-</span>
                      }
                    </div>
                  </div>
                  <div class="col-span-2">
                    <span class="text-smoke-400 text-sm truncate block" [title]="event.page">
                      {{ getShortPage(event.page) }}
                    </span>
                  </div>
                  <div class="col-span-2">
                    <span class="text-smoke-400 text-sm capitalize">{{ event.platform ?? '-' }}</span>
                  </div>
                  <div class="col-span-1 text-right">
                    <span class="text-smoke-500 text-xs">{{ formatDate(event.createdAt) }}</span>
                  </div>
                </div>

                <!-- Expanded Details -->
                @if (analyticsStore.isExpanded(event.id)) {
                  <div class="px-4 py-4 bg-smoke-850 border-t border-smoke-700">
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <!-- Basic Info -->
                      <div class="space-y-2">
                        <h4 class="text-sm font-medium text-smoke-300 mb-2">Informations</h4>
                        <div class="text-sm">
                          <span class="text-smoke-500">ID: </span>
                          <span class="text-smoke-300 font-mono text-xs">{{ event.id }}</span>
                        </div>
                        <div class="text-sm">
                          <span class="text-smoke-500">Page complete: </span>
                          <span class="text-smoke-300">{{ event.page }}</span>
                        </div>
                        <div class="text-sm">
                          <span class="text-smoke-500">Ecran: </span>
                          <span class="text-smoke-300">
                            {{ event.screenWidth ?? '?' }}x{{ event.screenHeight ?? '?' }}
                          </span>
                        </div>
                        <div class="text-sm">
                          <span class="text-smoke-500">Date complete: </span>
                          <span class="text-smoke-300">{{ formatFullDate(event.createdAt) }}</span>
                        </div>
                      </div>

                      <!-- Tasting Details (if applicable) -->
                      @if (isTastingEvent(event.event)) {
                        <div class="space-y-2">
                          <h4 class="text-sm font-medium text-smoke-300 mb-2">Details Degustation</h4>
                          @if (hasTastingDetails(event)) {
                            @if (getTastingId(event)) {
                              <div class="text-sm">
                                <span class="text-smoke-500">Tasting ID: </span>
                                <span class="text-smoke-300 font-mono text-xs">{{ getTastingId(event) }}</span>
                              </div>
                            }
                            @if (getCigarId(event)) {
                              <div class="text-sm">
                                <span class="text-smoke-500">Cigare ID: </span>
                                <span class="text-smoke-300 font-mono text-xs">{{ getCigarId(event) }}</span>
                              </div>
                            }
                            @if (getPhase(event)) {
                              <div class="text-sm">
                                <span class="text-smoke-500">Phase: </span>
                                <span class="px-2 py-0.5 rounded text-xs font-medium" [class]="getPhaseColor(getPhase(event)!)">
                                  {{ getPhaseLabel(getPhase(event)!) }}
                                </span>
                              </div>
                            }
                            @if (event.event === 'tasting_completed') {
                              <div class="text-sm flex items-center gap-2">
                                <span class="text-smoke-500">Statut: </span>
                                <span class="px-2 py-0.5 rounded text-xs font-medium bg-green-500/20 text-green-400">
                                  Complete
                                </span>
                              </div>
                            }
                            @if (event.event === 'tasting_abandoned') {
                              <div class="text-sm flex items-center gap-2">
                                <span class="text-smoke-500">Statut: </span>
                                <span class="px-2 py-0.5 rounded text-xs font-medium bg-red-500/20 text-red-400">
                                  Abandonne{{ getPhase(event) ? ' a ' + getPhaseLabel(getPhase(event)!) : '' }}
                                </span>
                              </div>
                            }
                          } @else {
                            <p class="text-smoke-500 text-sm">Pas de details supplementaires</p>
                          }
                        </div>
                      }

                      <!-- Raw Data -->
                      @if (hasEventData(event)) {
                        <div class="space-y-2">
                          <h4 class="text-sm font-medium text-smoke-300 mb-2">Donnees brutes</h4>
                          <pre class="bg-smoke-900 rounded p-2 text-xs text-smoke-400 overflow-x-auto">{{ formatJson(event.data) }}</pre>
                        </div>
                      }
                    </div>
                  </div>
                }
              </div>
            }
          }

          <!-- Footer with Pagination -->
          <div class="px-4 py-3 bg-smoke-850 border-t border-smoke-700 flex items-center justify-between">
            <span class="text-sm text-smoke-500">
              {{ analyticsStore.events.data()?.meta?.total ?? 0 }} evenements au total
            </span>

            @if (analyticsStore.totalPages() > 1) {
              <div class="flex items-center gap-2">
                <ui-button
                  variant="secondary"
                  size="sm"
                  [disabled]="!analyticsStore.hasPrevPage() || analyticsStore.events.loading()"
                  (click)="analyticsStore.prevPage()"
                >
                  <i name="chevron-left" class="w-4 h-4"></i>
                </ui-button>

                <span class="text-sm text-smoke-300 px-2">
                  Page {{ analyticsStore.currentPage() }} / {{ analyticsStore.totalPages() }}
                </span>

                <ui-button
                  variant="secondary"
                  size="sm"
                  [disabled]="!analyticsStore.hasNextPage() || analyticsStore.events.loading()"
                  (click)="analyticsStore.nextPage()"
                >
                  <i name="chevron-right" class="w-4 h-4"></i>
                </ui-button>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class AnalyticsComponent {
  readonly analyticsStore: AdminAnalyticsStore = injectAdminAnalyticsStore();

  readonly stats = computed(() => this.analyticsStore.stats.data());
  readonly events = computed(() => this.analyticsStore.events.data()?.data ?? []);

  // Event helpers
  getEventColor(eventName: string): string {
    if (eventName.includes('completed')) return 'text-green-400';
    if (eventName.includes('started')) return 'text-blue-400';
    if (eventName.includes('abandoned')) return 'text-red-400';
    if (eventName.includes('install')) return 'text-purple-400';
    return 'text-smoke-300';
  }

  getShortPage(page: string): string {
    const parts = page.split('/').filter(Boolean);
    if (parts.length <= 2) return page;
    return '/' + parts.slice(-2).join('/');
  }

  formatDate(date: string | Date): string {
    const d = new Date(date);
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  }

  formatFullDate(date: string | Date): string {
    const d = new Date(date);
    return d.toLocaleString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  formatJson(data: Record<string, unknown> | null | undefined): string {
    if (!data) return '{}';
    return JSON.stringify(data, null, 2);
  }

  // Tasting event helpers
  isTastingEvent(eventName: string): boolean {
    return eventName.startsWith('tasting_');
  }

  hasTastingDetails(event: AnalyticsEventResponseDto): boolean {
    if (!event.data) return false;
    const data = event.data as Record<string, unknown>;
    return Boolean(data['tastingId'] || data['cigarId'] || data['phase']);
  }

  getTastingId(event: AnalyticsEventResponseDto): string | undefined {
    const data = event.data as Record<string, unknown> | null;
    return data?.['tastingId'] as string | undefined;
  }

  getCigarId(event: AnalyticsEventResponseDto): string | undefined {
    const data = event.data as Record<string, unknown> | null;
    return data?.['cigarId'] as string | undefined;
  }

  getPhase(event: AnalyticsEventResponseDto): string | undefined {
    const data = event.data as Record<string, unknown> | null;
    return data?.['phase'] as string | undefined;
  }

  hasEventData(event: AnalyticsEventResponseDto): boolean {
    if (!event.data) return false;
    return Object.keys(event.data).length > 0;
  }

  getPhaseLabel(phase: string): string {
    const labels: Record<string, string> = {
      appearance: 'Apparence',
      construction: 'Construction',
      cold_draw: 'Tirage a froid',
      first_third: 'Premier tiers',
      second_third: 'Deuxieme tiers',
      final_third: 'Dernier tiers',
      overall: 'Global',
    };
    return labels[phase] || phase;
  }

  getPhaseColor(phase: string): string {
    const colors: Record<string, string> = {
      appearance: 'bg-blue-500/20 text-blue-400',
      construction: 'bg-purple-500/20 text-purple-400',
      cold_draw: 'bg-cyan-500/20 text-cyan-400',
      first_third: 'bg-orange-500/20 text-orange-400',
      second_third: 'bg-gold-500/20 text-gold-400',
      final_third: 'bg-red-500/20 text-red-400',
      overall: 'bg-green-500/20 text-green-400',
    };
    return colors[phase] || 'bg-smoke-600/20 text-smoke-400';
  }
}
