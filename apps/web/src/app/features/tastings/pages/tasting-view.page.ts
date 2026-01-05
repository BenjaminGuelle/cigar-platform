import { Component, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import {
  IconDirective,
  PageSectionComponent,
  ButtonComponent,
  RatingBandsComponent,
} from '@cigar-platform/shared/ui';
import { injectTastingStore } from '../../../core/stores/tasting.store';
import { AROMAS, TASTES } from '@cigar-platform/shared/constants';

/**
 * Map for translating aroma/taste IDs to French labels
 */
const FLAVOR_LABELS_MAP = new Map<string, string>([
  ...AROMAS.map(a => [a.id, a.label] as const),
  ...TASTES.map(t => [t.id, t.label] as const),
]);

function getFlavorLabel(id: string): string {
  return FLAVOR_LABELS_MAP.get(id) ?? id;
}

/**
 * Tasting View Page (Read-only)
 *
 * Route: /tastings/:id
 * Accessible: Authenticated users
 *
 * Features:
 * - View completed tasting details
 * - See cigar info, rating, notes
 * - See observations (aromas, tastes) if chronic
 * - View context (situation, pairing, location)
 *
 * Architecture: ALL STARS
 */
@Component({
  selector: 'app-tasting-view',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    IconDirective,
    PageSectionComponent,
    ButtonComponent,
    RatingBandsComponent,
    DatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mx-auto max-w-4xl space-y-6 md:space-y-8 px-4 md:px-6 py-6 md:py-8">
      <!-- Back Button -->
      <div>
        <a routerLink="/tastings" class="inline-flex items-center gap-2 text-smoke-400 hover:text-gold-500 transition-colors">
          <i name="arrow-left" class="w-4 h-4"></i>
          <span class="text-sm">Retour aux dégustations</span>
        </a>
      </div>

      <!-- Loading State -->
      @if (loading()) {
        <div class="flex justify-center py-12">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-500"></div>
        </div>
      }

      <!-- Error State -->
      @if (error()) {
        <div class="text-center py-12">
          <i name="alert-circle" class="w-12 h-12 text-red-500 mx-auto mb-4"></i>
          <p class="text-smoke-400">Dégustation introuvable</p>
          <a routerLink="/tastings" class="mt-4 inline-block">
            <ui-button variant="ghost" size="sm">
              Retour à la liste
            </ui-button>
          </a>
        </div>
      }

      <!-- Tasting Content -->
      @if (!loading() && !error() && tasting()) {
        <!-- Header: Cigar Info -->
        <div class="flex items-start gap-4">
          <!-- Brand Logo -->
          <div class="flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-lg bg-smoke-700 flex items-center justify-center overflow-hidden">
            @if (brandLogoUrl()) {
              <img
                [src]="brandLogoUrl()"
                [alt]="brandName()"
                class="w-full h-full object-contain"
              />
            } @else {
              <i name="flame" class="w-8 h-8 text-smoke-500"></i>
            }
          </div>

          <!-- Cigar Details -->
          <div class="flex-1 min-w-0">
            <h1 class="font-display text-2xl md:text-3xl text-gold-500 truncate">
              {{ cigarName() }}
            </h1>
            <p class="text-smoke-400 truncate">{{ brandName() }}</p>
            <p class="text-sm text-smoke-500 mt-1">
              {{ tastingDate() | date:'EEEE d MMMM yyyy' }}
            </p>
          </div>
        </div>

        <!-- Rating Bands -->
        @if (rating()) {
          <div class="flex justify-center">
            <ui-rating-bands [value]="ratingOn5()" size="md" />
          </div>
        }

        <!-- Context Section -->
        @if (situation() || pairing() || location()) {
          <ui-page-section title="Le Moment" [showDivider]="true">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              @if (situation()) {
                <div class="p-4 rounded-lg bg-smoke-800 border border-smoke-700">
                  <p class="text-xs text-smoke-500 mb-1">Contexte</p>
                  <p class="text-smoke-200">{{ situation() }}</p>
                </div>
              }
              @if (pairing()) {
                <div class="p-4 rounded-lg bg-smoke-800 border border-smoke-700">
                  <p class="text-xs text-smoke-500 mb-1">Accompagnement</p>
                  <p class="text-smoke-200">{{ pairing() }}</p>
                  @if (pairingNote()) {
                    <p class="text-xs text-smoke-400 mt-1 italic">{{ pairingNote() }}</p>
                  }
                </div>
              }
              @if (location()) {
                <div class="p-4 rounded-lg bg-smoke-800 border border-smoke-700">
                  <p class="text-xs text-smoke-500 mb-1">Le Refuge</p>
                  <p class="text-smoke-200">{{ location() }}</p>
                </div>
              }
            </div>
          </ui-page-section>
        }

        <!-- Observations Section (if chronic data) -->
        @if (hasObservations()) {
          <ui-page-section title="Les Saveurs" subtitle="Notes de dégustation chronique" [showDivider]="true">
            <div class="space-y-4">
              @for (obs of observations(); track obs.phase) {
                <div class="p-4 rounded-lg bg-smoke-800 border border-smoke-700">
                  <h4 class="text-sm font-medium text-gold-500 mb-3">{{ getPhaseLabel(obs.phase) }}</h4>

                  <!-- Intensity & Combustion -->
                  @if (obs.intensity || obs.combustion) {
                    <div class="flex gap-4 mb-3">
                      @if (obs.intensity) {
                        <div class="flex items-center gap-2">
                          <span class="text-xs text-smoke-500">Intensité</span>
                          <span class="text-sm text-gold-400 font-medium">{{ obs.intensity }}/5</span>
                        </div>
                      }
                      @if (obs.combustion) {
                        <div class="flex items-center gap-2">
                          <span class="text-xs text-smoke-500">Combustion</span>
                          <span class="text-sm text-gold-400 font-medium">{{ obs.combustion }}/5</span>
                        </div>
                      }
                    </div>
                  }

                  @if (obs.aromas && obs.aromas.length > 0) {
                    <div>
                      <p class="text-xs text-smoke-500 mb-2">Arômes détectés</p>
                      <div class="flex flex-wrap gap-2">
                        @for (aroma of obs.aromas; track aroma) {
                          <span class="inline-flex items-center px-2 py-1 rounded text-xs bg-smoke-700 text-smoke-300">
                            {{ getFlavorLabel(aroma) }}
                          </span>
                        }
                      </div>
                    </div>
                  }

                  @if (obs.notes) {
                    <p class="text-sm text-smoke-300 mt-3 italic">{{ obs.notes }}</p>
                  }
                </div>
              }
            </div>
          </ui-page-section>
        }

        <!-- Comment Section -->
        @if (comment()) {
          <ui-page-section title="Le Verdict" [showDivider]="true">
            <div class="p-4 rounded-lg bg-smoke-800 border border-smoke-700">
              <p class="text-smoke-200 whitespace-pre-wrap">{{ comment() }}</p>
            </div>
          </ui-page-section>
        }

        <!-- Club Association -->
        @if (clubName()) {
          <ui-page-section title="Associé avec" [showDivider]="false">
            <div class="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-smoke-800 border border-smoke-700">
              <i name="users" class="w-4 h-4 text-gold-500"></i>
              <span class="text-smoke-200">{{ clubName() }}</span>
            </div>
          </ui-page-section>
        }
      }
    </div>
  `,
})
export class TastingViewPage {
  readonly #route = inject(ActivatedRoute);
  readonly #tastingStore = injectTastingStore();

  // Route params
  readonly tastingIdParam = toSignal(
    this.#route.paramMap.pipe(map((p) => p.get('id') ?? '')),
    { initialValue: '' }
  );

  // Query tasting by ID
  readonly tastingQuery = this.#tastingStore.getTastingById(() => this.tastingIdParam());

  // Query state
  readonly loading = this.tastingQuery.loading;
  readonly error = this.tastingQuery.error;

  // Tasting data
  readonly tasting = computed(() => this.tastingQuery.data() ?? null);

  // Computed fields
  readonly cigarName = computed(() => this.tasting()?.cigar?.name ?? 'Cigare inconnu');
  readonly brandName = computed(() => this.tasting()?.cigar?.brand?.name ?? '');
  readonly brandLogoUrl = computed(() => this.tasting()?.cigar?.brand?.logoUrl ?? null);
  readonly rating = computed(() => this.tasting()?.rating ?? null);
  // Rating is already on 0-5 scale in database
  readonly ratingOn5 = computed(() => this.rating() ?? 0);
  readonly comment = computed(() => this.tasting()?.comment ?? null);
  readonly tastingDate = computed(() => this.tasting()?.date ?? new Date());

  // Context fields
  readonly situation = computed(() => this.tasting()?.situation ?? null);
  readonly pairing = computed(() => this.tasting()?.pairing ?? null);
  readonly pairingNote = computed(() => this.tasting()?.pairingNote ?? null);
  readonly location = computed(() => this.tasting()?.location ?? null);

  // Club - Get first club name if shared
  readonly clubName = computed(() => {
    const clubs = this.tasting()?.clubs;
    return clubs && clubs.length > 0 ? clubs[0].name : null;
  });

  // Observations (chronic tasting data)
  readonly observations = computed(() => this.tasting()?.observations ?? []);
  readonly hasObservations = computed(() => this.observations().length > 0);

  // Helper methods
  getFlavorLabel(id: string): string {
    return getFlavorLabel(id);
  }

  getPhaseLabel(phase: string): string {
    const labels: Record<string, string> = {
      'COLD_DRAW': 'Fumage à cru',
      'FIRST_THIRD': 'Premier Tiers',
      'SECOND_THIRD': 'Deuxième Tiers',
      'FINAL_THIRD': 'Dernier Tiers',
      'PRESENTATION': 'Présentation',
      'CONCLUSION': 'Conclusion',
    };
    return labels[phase] ?? phase;
  }
}