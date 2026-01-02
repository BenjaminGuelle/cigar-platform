import { Component, OnInit, inject, OnDestroy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { TastingOrchestratorService } from '../../services/tasting-orchestrator.service';
import { TastingAutoSaveService } from '../../services/tasting-auto-save.service';
import { TastingScrollService } from '../../services/tasting-scroll.service';
import { TastingFormService } from '../../services/tasting-form.service';
import { PhaseQuickComponent } from '../../components/phase-quick/phase-quick.component';
import { PhasePresentationComponent } from '../../components/phase-presentation/phase-presentation.component';
import { PhaseFinaleComponent } from '../../components/phase-finale/phase-finale.component';
import { PhaseSectionComponent } from '../../components/phase-section/phase-section.component';
import { ConfirmationModalComponent } from '../../components/confirmation-modal/confirmation-modal.component';
import { DraftConfirmationModalComponent } from '../../components/draft-confirmation-modal/draft-confirmation-modal.component';
import { ExitConfirmationModalComponent } from '../../components/exit-confirmation-modal/exit-confirmation-modal.component';
import { DiscoveryBottomSheetComponent } from '../../components/discovery-bottom-sheet/discovery-bottom-sheet.component';
import { TastingTimelineComponent } from '../../components/tasting-timeline/tasting-timeline.component';
import { TastingSmartBarComponent } from '../../components/tasting-smart-bar/tasting-smart-bar.component';
import { IconDirective } from '@cigar-platform/shared/ui';
import type { CapeAspect, CapeColor, CapeTouch } from '@cigar-platform/shared/constants';

/**
 * Tasting Page Component
 * "Journal de Dégustation" - Vertical scrollable experience
 *
 * ALL STARS Architecture ⭐ (< 100 lignes)
 * - Orchestration UI uniquement
 * - Délègue TOUT au TastingOrchestratorService
 * - Template déclaratif pur
 * - Zero business logic
 *
 * Flow:
 * - Phase Quick → CTA A (Verdict) OR CTA B (Chronique)
 * - CTA A: Scroll direct to Finale
 * - CTA B: Premium = Chronique / Free = Discovery bottom sheet
 */
@Component({
  selector: 'app-tasting-page',
  standalone: true,
  imports: [
    CommonModule,
    PhaseQuickComponent,
    PhasePresentationComponent,
    PhaseFinaleComponent,
    PhaseSectionComponent,
    ConfirmationModalComponent,
    DraftConfirmationModalComponent,
    ExitConfirmationModalComponent,
    DiscoveryBottomSheetComponent,
    TastingTimelineComponent,
    TastingSmartBarComponent,
    IconDirective,
  ],
  providers: [TastingOrchestratorService, TastingAutoSaveService, TastingScrollService, TastingFormService],
  template: `
    <div class="fixed inset-0 bg-zinc-900 z-1000 flex flex-col">
      <!-- Header Sticky -->
      <header class="sticky top-0 z-100 flex items-center gap-4 px-6 py-4 border-b border-gold-500/20 bg-smoke-800 backdrop-blur-md">
        <button
          type="button"
          (click)="orchestrator.handleBack()"
          class="flex items-center justify-center w-10 h-10 text-gold-500 hover:bg-gold-500/10 rounded-lg transition-colors"
        >
          <i name="arrow-left" class="w-6 h-6"></i>
        </button>
        <div class="flex-1 flex flex-col gap-1">
          <h1 class="text-2xl font-display text-gold-500 tracking-wide">Le Rituel</h1>
          @if (autoSave.saveStatus()) {
            <span class="text-xs text-smoke-400 opacity-70">{{ autoSave.saveStatus() }}</span>
          }
        </div>
        <div class="font-mono text-sm text-smoke-400 opacity-60 min-w-12.5 text-right">
          {{ orchestrator.elapsedTime() }}
        </div>
      </header>

      <!-- Timeline (responsive) -->
      <app-tasting-timeline
        [currentPhase]="orchestrator.currentPhase()"
        [revealedPhases]="orchestrator.revealedPhases()"
        [isDiscoveryMode]="orchestrator.isDiscoveryMode()"
        (phaseClicked)="handleTimelinePhaseClick($event)"
      />

      <!-- Journal Content (Scroll vertical) -->
      <main class="flex-1 overflow-y-auto scroll-smooth scroll-snap-type-y-proximity md:ml-20" style="scroll-snap-type: y proximity;">
        <!-- Phase Quick -->
        <app-phase-section phaseId="phase-quick">
          <app-phase-quick
            [initialCigar]="orchestrator.confirmedDraftCigar()"
            (dataChange)="handleQuickDataChange($event)"
          />
        </app-phase-section>

        <!-- Observations (Chronique flow - révélées conditionnellement) -->
        @if (orchestrator.flowMode() === 'chronique') {
          @if (orchestrator.isDiscoveryMode()) {
            <div class="sticky top-20 z-90 px-6 py-3 bg-gold-500/10 border-l-4 border-gold-500 text-center text-sm text-smoke-200 mb-8">
              Mode Découverte — Ces analyses ne seront pas sauvegardées
            </div>
          }
          <app-phase-section phaseId="phase-presentation">
            <app-phase-presentation (dataChange)="handlePresentationDataChange($event)" />
          </app-phase-section>
        }

        <!-- Phase Finale -->
        <app-phase-section phaseId="phase-finale">
          <app-phase-finale
            (complete)="orchestrator.completeTasting()"
            (dataChange)="handleFinaleDataChange($event)"
          />
        </app-phase-section>
      </main>

      <!-- Modals -->
      @if (orchestrator.showConfirmation()) {
        <app-confirmation-modal
          (viewTasting)="orchestrator.viewTasting()"
          (close)="orchestrator.close()"
        />
      }

      <app-discovery-bottom-sheet
        [isOpen]="orchestrator.showDiscoveryBottomSheet()"
        (close)="orchestrator.handleDiscovery_Cancel()"
        (discover)="orchestrator.handleDiscovery_Confirm()"
        (upgradePremium)="orchestrator.handleDiscovery_UpgradePremium()"
      />

      <app-draft-confirmation-modal
        [isOpen]="orchestrator.showDraftConfirmation()"
        [draft]="orchestrator.existingDraft()"
        (continue)="handleContinueDraft()"
        (newTasting)="handleNewTasting()"
        (close)="orchestrator.showDraftConfirmation.set(false)"
      />

      <app-exit-confirmation-modal
        [isOpen]="orchestrator.showExitConfirmation()"
        (confirm)="orchestrator.confirmExit()"
        (cancel)="orchestrator.showExitConfirmation.set(false)"
        (close)="orchestrator.showExitConfirmation.set(false)"
      />

      <!-- Smart Bar (fixed bottom) -->
      <app-tasting-smart-bar
        [currentPhase]="orchestrator.currentPhase()"
        [elapsedTime]="orchestrator.elapsedTime()"
        [isLoading]="orchestrator.isCompleting()"
        (scrollToSection)="handleSmartBarScroll($event)"
        (nextAction)="handleSmartBarNext()"
      />
    </div>
  `,
})
export class TastingPageComponent implements OnInit, OnDestroy {
  readonly #route = inject(ActivatedRoute);

  // Orchestrator (Single Source of Truth)
  readonly orchestrator = inject(TastingOrchestratorService);

  // Auto-save (pour afficher le status dans le header)
  readonly autoSave = inject(TastingAutoSaveService);

  // Scroll service (pour IntersectionObserver)
  readonly #scroll = inject(TastingScrollService);

  constructor() {
    // Synchroniser la phase courante avec le scroll
    effect(() => {
      const phaseFromScroll = this.#scroll.currentPhaseFromScroll();
      this.orchestrator.currentPhase.set(phaseFromScroll);
    });
  }

  async ngOnInit(): Promise<void> {
    const id = this.#route.snapshot.paramMap.get('id');
    const cigarId = this.#route.snapshot.queryParamMap.get('cigarId');
    const eventId = this.#route.snapshot.queryParamMap.get('eventId');

    // Orchestrator gère tout (contexte, auto-complete, création)
    await this.orchestrator.createOrLoadDraft(
      id && id !== 'new' ? id : cigarId,
      eventId
    );

    // Setup IntersectionObserver pour détecter la phase active via scroll
    // Délai pour s'assurer que le DOM est rendu
    setTimeout(() => {
      this.#scroll.setupScrollObserver();
    }, 100);
  }

  // ==================== Data Change Handlers ====================

  async handleQuickDataChange(data: any): Promise<void> {
    await this.orchestrator.updateQuickData({
      moment: data.moment,
      situation: data.situation,
      pairing: data.pairing,
      pairingNote: data.pairingNote || undefined,
      location: data.location || undefined,
      cigarId: data.cigar || undefined,
    });
  }

  handlePresentationDataChange(data: {
    wrapperAspect: CapeAspect[];
    wrapperColor: CapeColor | null;
    touch: CapeTouch[];
  }): void {
    this.orchestrator.updateObservation('presentation', {
      presentation: {
        wrapperAspect: data.wrapperAspect,
        wrapperColor: data.wrapperColor,
        touch: data.touch,
      },
    });
  }

  handleFinaleDataChange(data: { rating: number; comment: string }): void {
    this.orchestrator.updateFinaleData(data);
  }

  // ==================== Timeline & SmartBar Handlers ====================

  /**
   * Timeline: Phase clicked
   * Scroll to the selected phase
   */
  handleTimelinePhaseClick(phase: string): void {
    this.orchestrator.scrollToPhase(`phase-${phase.replace('_', '-')}`);
  }

  /**
   * SmartBar: Scroll to section (Le Verdict)
   */
  handleSmartBarScroll(sectionId: string): void {
    this.orchestrator.scrollToPhase(sectionId);
  }

  /**
   * SmartBar: Next action (contextual selon la phase)
   */
  async handleSmartBarNext(): Promise<void> {
    await this.orchestrator.handleNextAction();
  }

  // ==================== Draft Confirmation Handlers ====================

  /**
   * Continuer le draft existant
   */
  async handleContinueDraft(): Promise<void> {
    await this.orchestrator.continueDraft();
  }

  /**
   * Créer un nouveau tasting (supprime le draft existant)
   */
  async handleNewTasting(): Promise<void> {
    const cigarId = this.#route.snapshot.queryParamMap.get('cigarId');
    const eventId = this.#route.snapshot.queryParamMap.get('eventId');
    await this.orchestrator.createNewAndDeleteDraft(cigarId, eventId);
  }

  // ==================== Cleanup ====================

  async ngOnDestroy(): Promise<void> {
    // Cleanup observer
    this.#scroll.destroyScrollObserver();

    // Flush pending saves
    await this.orchestrator.flush();
  }
}