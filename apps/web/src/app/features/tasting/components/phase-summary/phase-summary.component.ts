import { Component, input, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconDirective } from '@cigar-platform/shared/ui';
import { ToastService } from '../../../../core/services/toast.service';
import type { TastingPhase } from '../../services/tasting-orchestrator.service';
import { PhaseQuickRecapComponent } from '../shared/phase-quick-recap.component';
import { PhasePresentationRecapComponent } from '../shared/phase-presentation-recap.component';
import { FlavorRecapComponent } from '../shared/flavor-recap.component';
import { PhaseConclusionRecapComponent } from '../shared/phase-conclusion-recap.component';

type SummaryState = 'collapsed' | 'expanded';

/**
 * Phase Summary Component
 * Carte compacte résumant une phase complétée
 *
 * ALL STARS Architecture ⭐
 * - 3 états: collapsed | expanded (avec recap) | editing (future)
 * - Gestion interne du state (pas d'outputs expand/collapse)
 * - Tap → Expand avec RECAP (pas de navigation)
 * - Bouton Modifier → Message "À venir" (editing sera implémenté plus tard)
 * - Bouton Replier → Collapse
 * - Mode Discovery: bordures pointillées + badge ☁️
 *
 * Usage:
 * ```html
 * <app-phase-summary
 *   [phaseId]="'quick'"
 *   [summary]="'Soir • Digestif • Rhum'"
 *   [data]="quickData"
 *   [isDiscoveryMode]="true"
 * />
 * ```
 */
@Component({
  selector: 'app-phase-summary',
  standalone: true,
  imports: [CommonModule, IconDirective, PhaseQuickRecapComponent, PhasePresentationRecapComponent, FlavorRecapComponent, PhaseConclusionRecapComponent],
  template: `
    <div class="phase-summary-container mb-3">
      <!-- Résumé compact (collapsed) -->
      <button
        type="button"
        (click)="toggleExpand()"
        class="w-full p-4 bg-zinc-900/50 rounded-lg transition-all text-left
               flex items-center gap-3"
        [class]="isDiscoveryMode()
          ? 'border border-dashed border-gold-500/30 hover:border-gold-500/50'
          : 'border border-zinc-800 hover:border-gold-500/30'"
      >
        <!-- Check icon (or cloud in discovery mode) -->
        <span [class]="isDiscoveryMode() ? 'text-gold-500/70' : 'text-gold-500'">
          @if (isDiscoveryMode()) {
            <i name="cloud" class="w-4 h-4"></i>
          } @else {
            <i name="check" class="w-4 h-4"></i>
          }
        </span>

        <!-- Summary text -->
        <span class="flex-1 text-sm text-smoke-200">{{ summary() }}</span>

        <!-- Discovery badge (if in discovery mode) -->
        @if (isDiscoveryMode()) {
          <span class="text-xs text-gold-500/50 italic mr-2">Découverte</span>
        }

        <!-- Icon (edit ou collapse) -->
        <span class="text-smoke-500">
          @if (state() === 'expanded') {
            <i name="chevron-up" class="w-4 h-4"></i>
          } @else {
            <i name="edit" class="w-4 h-4"></i>
          }
        </span>
      </button>

      <!-- Expanded content (RECAP) -->
      <div
        class="phase-content"
        [class.expanded]="state() === 'expanded'"
        [class.discovery-mode]="isDiscoveryMode()"
      >
        <div class="overflow-hidden">
          <!-- Recap -->
          <div class="pt-4 px-4">
            @switch (phaseId()) {
              @case ('quick') {
                <!-- Phase Quick Recap -->
                @if (data(); as quickData) {
                  <app-phase-quick-recap
                    [cigarName]="quickData.cigarName"
                    [moment]="quickData.moment"
                    [situation]="quickData.situation"
                    [pairing]="quickData.pairing"
                    [pairingNote]="quickData.pairingNote"
                    [location]="quickData.location"
                  />
                } @else {
                  <p class="text-sm text-smoke-400 italic text-center py-4">
                    Aucune donnée disponible
                  </p>
                }
              }
              @case ('presentation') {
                <!-- Phase Presentation Recap -->
                @if (data(); as presentationData) {
                  <app-phase-presentation-recap
                    [wrapperAspect]="presentationData.wrapperAspect"
                    [wrapperColor]="presentationData.wrapperColor"
                    [touch]="presentationData.touch"
                  />
                } @else {
                  <p class="text-sm text-smoke-400 italic text-center py-4">
                    Aucune donnée disponible
                  </p>
                }
              }
              @case ('cold_draw') {
                <!-- Phase Cold Draw Recap -->
                @if (data(); as coldDrawData) {
                  <app-flavor-recap
                    [tastes]="coldDrawData.tastes"
                    [aromas]="coldDrawData.aromas"
                  />
                } @else {
                  <p class="text-sm text-smoke-400 italic text-center py-4">
                    Aucune donnée disponible
                  </p>
                }
              }
              @case ('first_third') {
                <!-- Phase First Third Recap -->
                @if (data(); as firstThirdData) {
                  <app-flavor-recap
                    [tastes]="firstThirdData.tastes"
                    [aromas]="firstThirdData.aromas"
                  />
                } @else {
                  <p class="text-sm text-smoke-400 italic text-center py-4">
                    Aucune donnée disponible
                  </p>
                }
              }
              @case ('second_third') {
                <!-- Phase Second Third Recap -->
                @if (data(); as secondThirdData) {
                  <app-flavor-recap
                    [tastes]="secondThirdData.tastes"
                    [aromas]="secondThirdData.aromas"
                  />
                } @else {
                  <p class="text-sm text-smoke-400 italic text-center py-4">
                    Aucune donnée disponible
                  </p>
                }
              }
              @case ('final_third') {
                <!-- Phase Final Third Recap -->
                @if (data(); as finalThirdData) {
                  <app-flavor-recap
                    [tastes]="finalThirdData.tastes"
                    [aromas]="finalThirdData.aromas"
                  />
                } @else {
                  <p class="text-sm text-smoke-400 italic text-center py-4">
                    Aucune donnée disponible
                  </p>
                }
              }
              @case ('conclusion') {
                <!-- Phase Conclusion Recap -->
                @if (data(); as conclusionData) {
                  <app-phase-conclusion-recap
                    [draw]="conclusionData.draw"
                    [ashNature]="conclusionData.ashNature"
                    [balance]="conclusionData.balance"
                    [terroir]="conclusionData.terroir"
                    [power]="conclusionData.power"
                    [variety]="conclusionData.variety"
                    [mouthImpression]="conclusionData.mouthImpression"
                    [persistence]="conclusionData.persistence"
                  />
                } @else {
                  <p class="text-sm text-smoke-400 italic text-center py-4">
                    Aucune donnée disponible
                  </p>
                }
              }
              @default {
                <p class="text-sm text-smoke-400 italic text-center py-4">
                  Récapitulatif à venir
                </p>
              }
            }
          </div>

          <!-- Discovery mode notice -->
          @if (isDiscoveryMode()) {
            <div class="px-4 pt-2">
              <p class="text-xs text-gold-500/50 italic text-center flex items-center justify-center gap-2">
                <i name="cloud" class="w-3 h-3"></i>
                <span>Ces notes ne seront pas sauvegardées</span>
              </p>
            </div>
          }

          <!-- Actions -->
          <div class="flex justify-center gap-4 pt-6 pb-2">
            <button
              type="button"
              (click)="handleModifier()"
              class="px-4 py-2 text-sm text-gold-500 hover:text-gold-400 transition-colors"
            >
              Modifier
            </button>
            <button
              type="button"
              (click)="collapse()"
              class="px-4 py-2 text-sm text-smoke-400 hover:text-gold-500 transition-colors flex items-center gap-1"
            >
              <span>Replier</span>
              <i name="chevron-up" class="w-4 h-4"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* Fold/Unfold animation avec CSS Grid */
    .phase-content {
      display: grid;
      grid-template-rows: 0fr;
      transition: grid-template-rows 0.4s ease-out;
    }

    .phase-content.expanded {
      grid-template-rows: 1fr;
    }

    .phase-content > div {
      overflow: hidden;
    }

    /* Discovery mode: subtle dotted border on expanded content */
    .phase-content.discovery-mode.expanded {
      border-left: 2px dashed rgba(212, 175, 55, 0.2);
      margin-left: 1rem;
      padding-left: 0.5rem;
    }
  `],
})
export class PhaseSummaryComponent {
  readonly #toast = inject(ToastService);

  // Inputs
  phaseId = input.required<TastingPhase>();
  summary = input.required<string>();
  data = input<any>(); // Phase-specific data (typed per phase)
  isDiscoveryMode = input<boolean>(false);

  // State
  state = signal<SummaryState>('collapsed');

  // ==================== Handlers ====================

  toggleExpand(): void {
    if (this.state() === 'expanded') {
      this.collapse();
    } else {
      this.state.set('expanded');
    }
  }

  collapse(): void {
    this.state.set('collapsed');
  }

  handleModifier(): void {
    this.#toast.info('La modification des phases sera disponible prochainement');
    this.collapse();
  }
}