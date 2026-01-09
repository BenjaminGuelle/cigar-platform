import { Component, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ContextStore } from '../../../../core/stores/context.store';
import { injectClubStore } from '../../../../core/stores/club.store';
import { ButtonComponent } from '@cigar-platform/shared/ui';

/**
 * Club Dashboard Page
 * Dashboard for club context
 *
 * Shows:
 * - Club info
 * - Members card with count and access button
 * - Quick stats
 */
@Component({
  selector: 'app-dashboard-club',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ButtonComponent],
  template: `
    <div class="container-page content-section-lg">
      <!-- Welcome Card -->
      <div class="rounded-xl border border-smoke-700 bg-smoke-800 p-8 text-center shadow-xl shadow-smoke-950/50">
        <h2 class="mb-2 text-2xl font-bold text-smoke-50 md:text-4xl">
          {{ context().club?.name || 'Club' }}
        </h2>
        <p class="text-lg text-smoke-300">
          Tableau de bord du club
        </p>
      </div>

      <!-- Members Card -->
      <div class="rounded-xl border border-smoke-700 bg-smoke-800 p-6 shadow-xl shadow-smoke-950/50">
        <div class="flex items-center justify-between">
          <div class="flex-1">
            <h3 class="text-lg font-semibold text-smoke-50 mb-1">Membres</h3>
            <p class="text-smoke-400">
              @if (membersQuery.loading()) {
                <span class="text-sm">Chargement...</span>
              } @else if (membersQuery.data()) {
                <span class="text-2xl font-bold text-gold-500">
                  {{ membersQuery.data()!.length }}
                </span>
                <span class="text-sm ml-2">
                  {{ membersQuery.data()!.length === 1 ? 'membre actif' : 'membres actifs' }}
                </span>
              }
            </p>
          </div>

          <div>
            <ui-button
              variant="outline"
              icon="users"
              (clicked)="navigateToMembers()"
            >
              Voir les membres
            </ui-button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class DashboardClubPage {
  #router = inject(Router);
  readonly contextStore = inject(ContextStore);
  readonly clubStore = injectClubStore();

  readonly context = this.contextStore.context;

  // Get club members
  readonly membersQuery = this.clubStore.getClubMembers(() => this.context().clubId || '');

  navigateToMembers(): void {
    this.#router.navigate(['/membres']);
  }
}
