import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IconDirective, PageSectionComponent, ButtonComponent } from '@cigar-platform/shared/ui';
import { TastingCardComponent } from './tasting-card.component';
import type { JournalTastingDto } from '@cigar-platform/types';

/**
 * Journal Section Component
 *
 * Displays the last 3 tastings in the profile.
 * Shows different empty states based on context.
 *
 * Solo: "Créer une dégustation" CTA
 * Club: "Partagez vos dégustations" message
 */
@Component({
  selector: 'app-journal-section',
  standalone: true,
  imports: [CommonModule, RouterLink, IconDirective, PageSectionComponent, ButtonComponent, TastingCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ui-page-section [title]="context() === 'solo' ? 'Mon Journal' : 'Journal du Club'">
      @if (tastings() && tastings()!.length > 0) {
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
  readonly tastings = input<JournalTastingDto[] | null>(null);
}