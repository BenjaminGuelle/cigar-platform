import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IconDirective, PageSectionComponent, ButtonComponent, SkeletonComponent } from '@cigar-platform/shared/ui';
import { TastingCardComponent } from './tasting-card.component';
import type { JournalTastingDto } from '@cigar-platform/types';

/**
 * Journal Section Component
 *
 * Displays the last 3 tastings in the profile.
 * Shows different empty states based on context.
 * Supports loading state with skeleton placeholders.
 *
 * Solo: "Créer une dégustation" CTA
 * Club: "Partagez vos dégustations" message
 */
@Component({
  selector: 'app-journal-section',
  standalone: true,
  imports: [CommonModule, RouterLink, IconDirective, PageSectionComponent, ButtonComponent, SkeletonComponent, TastingCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ui-page-section [title]="context() === 'solo' ? 'Mon Journal' : 'Journal du Club'">
      @if (loading()) {
        <!-- Skeleton State -->
        <div class="space-y-3">
          @for (i of [1, 2, 3]; track i) {
            <div class="p-4 rounded-lg bg-smoke-800 border border-smoke-700">
              <div class="flex items-start gap-3">
                <!-- Brand Logo Skeleton -->
                <ui-skeleton variant="rounded" width="40px" height="40px" />

                <!-- Content Skeleton -->
                <div class="flex-1 min-w-0 space-y-2">
                  <ui-skeleton variant="text" width="140px" height="16px" />
                  <ui-skeleton variant="text" width="100px" height="12px" />
                  <div class="flex gap-1 mt-2">
                    <ui-skeleton variant="rounded" width="48px" height="20px" />
                    <ui-skeleton variant="rounded" width="56px" height="20px" />
                  </div>
                </div>

                <!-- Rating & Date Skeleton -->
                <div class="flex-shrink-0 space-y-1 text-right">
                  <ui-skeleton variant="text" width="40px" height="16px" />
                  <ui-skeleton variant="text" width="56px" height="12px" />
                </div>
              </div>
            </div>
          }
        </div>
        <div class="mt-4 flex justify-center">
          <ui-skeleton variant="rounded" width="80px" height="32px" />
        </div>
      } @else if (tastings() && tastings()!.length > 0) {
        <!-- Tasting List -->
        <div class="space-y-3">
          @for (tasting of tastings(); track tasting.id) {
            <app-tasting-card
              [tasting]="tasting"
              [showUser]="context() === 'club'"
            />
          }
        </div>

        <!-- View All Button -->
        <div class="mt-4 text-center">
          <a routerLink="/tastings">
            <ui-button size="sm" variant="ghost">
              Voir tout
            </ui-button>
          </a>
        </div>
      } @else {
        <!-- Empty State -->
        <div class="flex flex-col items-center justify-center py-8 px-4 rounded-lg bg-smoke-800 border border-smoke-700 text-center">
          <div class="w-12 h-12 rounded-full bg-smoke-700 flex items-center justify-center mb-4">
            <i name="book-open" class="w-6 h-6 text-smoke-500"></i>
          </div>
          <h4 class="text-sm font-medium text-smoke-200 mb-2">
            {{ context() === 'solo' ? 'Aucune dégustation' : 'Aucune dégustation partagée' }}
          </h4>
          <p class="text-xs text-smoke-400 max-w-xs mb-4">
            @if (context() === 'solo') {
              Commencez à déguster pour construire votre journal personnel.
            } @else {
              Les membres peuvent partager leurs dégustations avec le club.
            }
          </p>
          @if (context() === 'solo') {
            <a routerLink="/tasting/new">
              <ui-button size="sm" variant="secondary" icon="plus">
                Nouvelle dégustation
              </ui-button>
            </a>
          }
        </div>
      }
    </ui-page-section>
  `,
})
export class JournalSectionComponent {
  readonly context = input<'solo' | 'club'>('solo');
  readonly loading = input<boolean>(false);
  readonly tastings = input<JournalTastingDto[] | null>(null);
}