import { Component, OnInit, inject, OnDestroy, effect, computed, signal, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { TastingOrchestratorService, type TastingPhase } from '../../services/tasting-orchestrator.service';
import { TastingAutoSaveService } from '../../services/tasting-auto-save.service';
import { TastingScrollService } from '../../services/tasting-scroll.service';
import { TastingFormService } from '../../services/tasting-form.service';
import { TastingStateMachine } from '../../services/tasting-state-machine.service';
import { PhaseQuickComponent } from '../../components/phase-quick/phase-quick.component';
import { PhaseFinaleComponent } from '../../components/phase-finale/phase-finale.component';
import { PhasePresentationComponent } from '../../components/phase-presentation/phase-presentation.component';
import { PhaseColdDrawComponent } from '../../components/phase-cold-draw/phase-cold-draw.component';
import { PhaseTercioComponent } from '../../components/phase-tercio/phase-tercio.component';
import { PhaseConclusionComponent } from '../../components/phase-conclusion/phase-conclusion.component';
import { ConfirmationModalComponent } from '../../components/confirmation-modal/confirmation-modal.component';
import { DraftConfirmationModalComponent } from '../../components/draft-confirmation-modal/draft-confirmation-modal.component';
import { ExitConfirmationModalComponent } from '../../components/exit-confirmation-modal/exit-confirmation-modal.component';
import { DiscoveryBottomSheetComponent } from '../../components/discovery-bottom-sheet/discovery-bottom-sheet.component';
import { TastingTimelineComponent } from '../../components/tasting-timeline/tasting-timeline.component';
import { PhaseSummaryComponent } from '../../components/phase-summary/phase-summary.component';
import { IconDirective, ButtonComponent } from '@cigar-platform/shared/ui';
import type { TastingSituation, PairingType } from '@cigar-platform/shared/constants';
import type { FlavorTag, PhaseData } from '../../models/tasting-state.model';

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
    PhaseFinaleComponent,
    PhasePresentationComponent,
    PhaseColdDrawComponent,
    PhaseTercioComponent,
    PhaseConclusionComponent,
    PhaseSummaryComponent,
    ConfirmationModalComponent,
    DraftConfirmationModalComponent,
    ExitConfirmationModalComponent,
    DiscoveryBottomSheetComponent,
    TastingTimelineComponent,
    IconDirective,
    ButtonComponent,
  ],
  providers: [TastingStateMachine, TastingOrchestratorService, TastingAutoSaveService, TastingScrollService, TastingFormService],
  templateUrl: './tasting-page.component.html',
})
export class TastingPageComponent implements OnInit, OnDestroy {
  readonly #route = inject(ActivatedRoute);

  // Orchestrator (Single Source of Truth)
  readonly orchestrator = inject(TastingOrchestratorService);

  // Auto-save (pour afficher le status dans le header)
  readonly autoSave = inject(TastingAutoSaveService);

  // Scroll service (pour IntersectionObserver)
  readonly #scroll = inject(TastingScrollService);

  // Local state
  readonly #showDecisionCardSignal = signal(false);

  // ==================== Computed ====================

  /**
   * Show Decision Card after Phase Quick completed
   */
  readonly showDecisionCard = computed(() => {
    return this.#showDecisionCardSignal();
  });

  // ==================== Helpers ====================

  /**
   * Get phase summary text (for compact display)
   */
  getPhaseSummary(phaseId: TastingPhase): string {
    // TODO: Extract real data from observations
    // For now, placeholder summaries
    switch (phaseId) {
      case 'quick':
        return 'L\'Entrée en Matière complétée';
      case 'presentation':
        return 'Présentation complétée';
      case 'cold_draw':
        return 'Fumage à cru complété';
      case 'first_third':
        return 'Premier Tercio complété';
      case 'second_third':
        return 'Deuxième Tercio complété';
      case 'final_third':
        return 'Dernier Tercio complété';
      case 'conclusion':
        return 'Conclusion complétée';
      case 'finale':
        return 'Le Verdict posé';
      default:
        return '';
    }
  }

  /**
   * Check if phase should show discovery style
   * Quick and Finale are always saved, so no discovery style
   */
  isPhaseInDiscoveryMode(phaseId: TastingPhase): boolean {
    if (phaseId === 'quick' || phaseId === 'finale') {
      return false; // Always saved
    }
    return this.orchestrator.isDiscoveryMode();
  }

  /**
   * Get Quick situation typed for component input
   */
  getQuickSituation(): TastingSituation | null | undefined {
    const situation = this.orchestrator.quickData()?.situation;
    return situation as TastingSituation | null | undefined;
  }

  /**
   * Get Quick pairing typed for component input
   */
  getQuickPairing(): PairingType | null | undefined {
    const pairing = this.orchestrator.quickData()?.pairing;
    return pairing as PairingType | null | undefined;
  }

  /**
   * Get phase data (for detailed recap in expanded state)
   */
  getPhaseData(phaseId: TastingPhase): PhaseData {
    switch (phaseId) {
      case 'quick':
        return this.orchestrator.quickData();
      case 'presentation':
        return this.orchestrator.presentationData();
      case 'cold_draw':
        return this.orchestrator.coldDrawData();
      case 'first_third':
        return this.orchestrator.firstThirdData();
      case 'second_third':
        return this.orchestrator.secondThirdData();
      case 'final_third':
        return this.orchestrator.finalThirdData();
      case 'conclusion':
        return this.orchestrator.conclusionLocalData();
      case 'finale':
        return this.orchestrator.finaleData();
      default:
        return null;
    }
  }

  /**
   * Get next chronique phase in order
   * Présentation → Fumage à cru → 1er Tercio → 2ème Tercio → 3ème Tercio → Conclusion → Finale
   */
  getNextChroniquePhase(currentPhase: TastingPhase): TastingPhase | null {
    const chroniqueOrder: TastingPhase[] = [
      'presentation',
      'cold_draw',
      'first_third',
      'second_third',
      'final_third',
      'conclusion',
      'finale',
    ];
    const currentIndex = chroniqueOrder.indexOf(currentPhase);
    if (currentIndex === -1 || currentIndex === chroniqueOrder.length - 1) {
      return null;
    }
    return chroniqueOrder[currentIndex + 1];
  }

  /**
   * Handle Phase Quick reached 'done' step
   */
  handleQuickDone(): void {
    // If we're restoring a draft, don't show CTAs - let restoreObservationsData handle navigation
    if (this.orchestrator.isRestoringDraft()) {
      return;
    }

    this.#showDecisionCardSignal.set(true);
    // Update highest visited to unlock finale (done by state machine)
    this.orchestrator.markQuickPhaseCompleted();
  }

  /**
   * Handle Phase Présentation done
   * Auto-progression: collapse → pause 800ms → scroll to next phase
   */
  async handlePresentationDone(): Promise<void> {
    const nextPhase = this.getNextChroniquePhase('presentation');
    if (!nextPhase) return;

    // Pause to show recap before navigating
    await new Promise(resolve => setTimeout(resolve, 800));

    // Navigate to next phase (presentation will auto-collapse via completedPhases)
    this.orchestrator.navigateToPhase(nextPhase);
  }

  /**
   * Handle Phase Fumage à cru done
   * Auto-progression: collapse → pause 800ms → scroll to next phase
   */
  async handleColdDrawDone(): Promise<void> {
    const nextPhase = this.getNextChroniquePhase('cold_draw');
    if (!nextPhase) return;

    // Pause to show recap before navigating
    await new Promise(resolve => setTimeout(resolve, 800));

    // Navigate to next phase (cold_draw will auto-collapse via completedPhases)
    this.orchestrator.navigateToPhase(nextPhase);
  }

  /**
   * Handle Phase First Third done
   * Auto-progression: collapse → pause 800ms → scroll to next phase
   */
  async handleFirstThirdDone(): Promise<void> {
    const nextPhase = this.getNextChroniquePhase('first_third');
    if (!nextPhase) return;

    // Pause to show recap before navigating
    await new Promise(resolve => setTimeout(resolve, 800));

    // Navigate to next phase
    this.orchestrator.navigateToPhase(nextPhase);
  }

  /**
   * Handle Phase Second Third done
   * Auto-progression: collapse → pause 800ms → scroll to next phase
   */
  async handleSecondThirdDone(): Promise<void> {
    const nextPhase = this.getNextChroniquePhase('second_third');
    if (!nextPhase) return;

    // Pause to show recap before navigating
    await new Promise(resolve => setTimeout(resolve, 800));

    // Navigate to next phase
    this.orchestrator.navigateToPhase(nextPhase);
  }

  /**
   * Handle Phase Final Third done
   * Auto-progression: collapse → pause 800ms → scroll to next phase
   */
  async handleFinalThirdDone(): Promise<void> {
    const nextPhase = this.getNextChroniquePhase('final_third');
    if (!nextPhase) return;

    // Pause to show recap before navigating
    await new Promise(resolve => setTimeout(resolve, 800));

    // Navigate to next phase
    this.orchestrator.navigateToPhase(nextPhase);
  }

  /**
   * Handle Phase Conclusion done
   * Auto-progression: collapse → pause 800ms → scroll to finale
   */
  async handleConclusionDone(): Promise<void> {
    const nextPhase = this.getNextChroniquePhase('conclusion');
    if (!nextPhase) return;

    // Pause to show recap before navigating
    await new Promise(resolve => setTimeout(resolve, 800));

    // Navigate to finale
    this.orchestrator.navigateToPhase(nextPhase);
  }

  /**
   * Handle Decision: Sceller le verdict
   * Uses skipToFinale() to bypass accessibility check (legitimate path after phase quick)
   */
  handleSceller(): void {
    this.#showDecisionCardSignal.set(false);
    this.orchestrator.skipToFinale();
  }

  /**
   * Handle Decision: Explorer la chronique
   * Premium → Révèle toutes les phases + scroll vers Présentation
   * Free → Discovery bottom sheet
   */
  async handleExplorer(): Promise<void> {
    this.#showDecisionCardSignal.set(false);
    await this.orchestrator.handleCtaB_Chronique();
  }

  /**
   * Handle "Poursuivre" button
   */
  handlePoursuivre(): void {
    const currentPhase = this.orchestrator.currentPhase();

    if (currentPhase === 'quick') {
      // Phase Quick done, show decision card
      this.#showDecisionCardSignal.set(true);
      // Update highest visited to unlock finale (done by state machine)
      this.orchestrator.markQuickPhaseCompleted();
      return;
    }

    if (currentPhase === 'finale') {
      // Finale → Complete tasting
      void this.orchestrator.completeTasting();
      return;
    }

    // Other phases: navigate to next (for future)
    // For now, just finale
    this.orchestrator.navigateToPhase('finale');
  }

  /**
   * Handle "Passer au verdict" (escape hatch)
   * Uses skipToFinale() to bypass accessibility check
   */
  handlePasserAuVerdict(): void {
    this.orchestrator.skipToFinale();
  }

  /**
   * Handle Discovery "Sceller le verdict" CTA
   * Close the modal and navigate to finale
   */
  handleDiscoveryGoToVerdict(): void {
    this.orchestrator.closeDiscoveryBottomSheet();
    this.orchestrator.navigateToPhase('finale');
  }

  constructor() {
    // Synchroniser la phase courante avec le scroll
    // IMPORTANT: Use untracked to read currentPhase without creating a dependency
    // This prevents infinite loop: scroll → setCurrentPhase → state change → effect re-run
    effect(() => {
      const phaseFromScroll = this.#scroll.currentPhaseFromScroll();
      // Only dispatch if phase actually changed (prevents infinite loop)
      const currentPhase = untracked(() => this.orchestrator.currentPhase());

      if (phaseFromScroll !== currentPhase) {
        this.orchestrator.setCurrentPhase(phaseFromScroll);
      }
    });

    // Re-setup observer when flowMode becomes 'chronique' (sections are now in DOM)
    // Track previous flowMode to only run once per transition
    let previousFlowMode: string | null = null;
    effect(() => {
      const flowMode = this.orchestrator.flowMode();

      // Only run when flowMode transitions TO 'chronique' (not repeatedly)
      if (flowMode === 'chronique' && previousFlowMode !== 'chronique') {
        previousFlowMode = flowMode;
        // Delay to ensure DOM has updated with new sections
        setTimeout(() => {
          this.#scroll.destroyScrollObserver();
          this.#scroll.setupScrollObserver();
        }, 150);
      } else {
        previousFlowMode = flowMode;
      }
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

  async handleQuickDataChange(data: {
    moment: string;
    situation: TastingSituation | null;
    pairing: PairingType | null;
    pairingNote?: string;
    location?: string;
    cigar: string | null;
    cigarName: string | null;
    clubId: string | null;
    clubName: string | null;
  }): Promise<void> {
    // Cast to DTO types (types are compatible, just different enum declarations)
    await this.orchestrator.updateQuickData({
      moment: (data.moment || undefined) as 'MATIN' | 'APRES_MIDI' | 'SOIR' | undefined,
      situation: (data.situation || undefined) as 'APERITIF' | 'COCKTAIL' | 'DIGESTIF' | undefined,
      pairing: (data.pairing || undefined) as 'WHISKY' | 'RHUM' | 'COGNAC' | 'CAFE' | 'THE' | 'EAU' | 'VIN' | 'BIERE' | 'AUTRE' | undefined,
      pairingNote: data.pairingNote || undefined,
      location: data.location || undefined,
      cigarId: data.cigar || undefined,
      cigarName: data.cigarName || undefined,
      clubId: data.clubId || undefined,
      clubName: data.clubName || undefined,
    });
  }

  handlePresentationDataChange(data: {
    wrapperAspect: string | null;
    wrapperColor: string | null;
    touch: string | null;
  }): void {
    // Update local signal for phase summary
    this.orchestrator.updatePresentationData({
      wrapperAspect: data.wrapperAspect,
      wrapperColor: data.wrapperColor,
      touch: data.touch,
    });

    // Save to DB via observation
    this.orchestrator.updateObservation('presentation', {
      presentation: {
        wrapperAspect: data.wrapperAspect,
        wrapperColor: data.wrapperColor,
        touch: data.touch,
      },
    });
  }

  handleColdDrawDataChange(data: {
    tastes: FlavorTag[];
    aromas: FlavorTag[];
  }): void {
    // Update local signal for phase summary
    this.orchestrator.updateColdDrawData({
      tastes: data.tastes,
      aromas: data.aromas,
    });

    // Save to DB via observation
    this.orchestrator.updateObservation('cold_draw', {
      coldDraw: {
        tastes: data.tastes,
        aromas: data.aromas,
      },
    });
  }

  handleFirstThirdDataChange(data: {
    tastes: FlavorTag[];
    aromas: FlavorTag[];
  }): void {
    // Update local signal for phase summary
    this.orchestrator.updateFirstThirdData({
      tastes: data.tastes,
      aromas: data.aromas,
    });

    // Save to DB via observation
    this.orchestrator.updateObservation('first_third', {
      firstThird: {
        tastes: data.tastes,
        aromas: data.aromas,
      },
    });
  }

  handleSecondThirdDataChange(data: {
    tastes: FlavorTag[];
    aromas: FlavorTag[];
  }): void {
    // Update local signal for phase summary
    this.orchestrator.updateSecondThirdData({
      tastes: data.tastes,
      aromas: data.aromas,
    });

    // Save to DB via observation
    this.orchestrator.updateObservation('second_third', {
      secondThird: {
        tastes: data.tastes,
        aromas: data.aromas,
      },
    });
  }

  handleFinalThirdDataChange(data: {
    tastes: FlavorTag[];
    aromas: FlavorTag[];
  }): void {
    // Update local signal for phase summary
    this.orchestrator.updateFinalThirdData({
      tastes: data.tastes,
      aromas: data.aromas,
    });

    // Save to DB via observation
    this.orchestrator.updateObservation('final_third', {
      finalThird: {
        tastes: data.tastes,
        aromas: data.aromas,
      },
    });
  }

  handleConclusionDataChange(data: {
    draw: string | null;
    ashNature: string | null;
    balance: string | null;
    terroir: string | null;
    power: number;
    variety: number;
    mouthImpression: string[];
    persistence: string | null;
  }): void {
    // Update local signal for phase summary
    this.orchestrator.updateConclusionLocalData({
      draw: data.draw,
      ashNature: data.ashNature,
      balance: data.balance,
      terroir: data.terroir,
      power: data.power,
      variety: data.variety,
      mouthImpression: data.mouthImpression,
      persistence: data.persistence,
    });

    // Save to DB via observation
    this.orchestrator.updateObservation('conclusion', {
      conclusion: {
        draw: data.draw,
        ashNature: data.ashNature,
        balance: data.balance,
        terroir: data.terroir,
        power: data.power,
        variety: data.variety,
        mouthImpression: data.mouthImpression,
        persistence: data.persistence,
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