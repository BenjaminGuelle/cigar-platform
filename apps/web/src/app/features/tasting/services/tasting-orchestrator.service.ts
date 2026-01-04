import { Injectable, inject, computed, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { injectTastingStore } from '../../../core/stores/tasting.store';
import { injectObservationStore } from '../../../core/stores/observation.store';
import { ContextStore } from '../../../core/stores/context.store';
import { PlanService } from '../../../core/services/plan.service';
import { ToastService } from '../../../core/services/toast.service';
import { TastingAutoSaveService } from './tasting-auto-save.service';
import { TastingScrollService } from './tasting-scroll.service';
import { TastingFormService } from './tasting-form.service';
import { TastingStateMachine } from './tasting-state-machine.service';
import { TastingsService } from '@cigar-platform/types/lib/tastings/tastings.service';
import type {
  CreateTastingDto,
  CompleteTastingDto,
  UpdateTastingDto,
} from '@cigar-platform/types';
import type {
  CapeAspect,
  CapeColor,
  CapeTouch,
  Draw,
  AshNature,
  Balance,
  Terroir,
  MouthImpression,
  Persistence,
} from '@cigar-platform/shared/constants';
import type { TastingPhase, FlowMode, FlavorTag } from '../models/tasting-state.model';

// Re-export types for backward compatibility
export type { TastingPhase, FlowMode } from '../models/tasting-state.model';

/**
 * Tasting Orchestrator Service
 *
 * ALL STARS Architecture ⭐
 * - Façade pattern: Delegates state management to TastingStateMachine
 * - Keeps business logic (API calls, navigation, side effects)
 * - Components continue using this service (no breaking changes)
 *
 * Responsibilities:
 * 1. API calls (create, load, complete, delete)
 * 2. Context management (Solo/Club/Event)
 * 3. Side effects coordination (AutoSave, Scroll, Toast)
 * 4. Exposes state machine signals for components
 */
@Injectable()
export class TastingOrchestratorService implements OnDestroy {
  // Services
  readonly #router = inject(Router);
  readonly #tastingStore = injectTastingStore();
  readonly #observationStore = injectObservationStore();
  readonly #tastingsService = inject(TastingsService);
  readonly #contextStore = inject(ContextStore);
  readonly #planService = inject(PlanService);
  readonly #toast = inject(ToastService);
  readonly #autoSave = inject(TastingAutoSaveService);
  readonly #scroll = inject(TastingScrollService);
  readonly #formService = inject(TastingFormService);

  // State Machine (Single Source of Truth)
  readonly #machine = inject(TastingStateMachine);

  // Timer
  readonly #startTime = Date.now();
  #timerInterval: ReturnType<typeof setInterval> | null = null;

  // ==================== Exposed State (from State Machine) ====================

  // Identity
  readonly tastingId = this.#machine.tastingId;
  readonly cigarId = this.#machine.cigarId;
  readonly eventId = this.#machine.eventId;
  readonly existingDraft = this.#machine.existingDraft;
  readonly confirmedDraftCigar = this.#machine.confirmedDraftCigar;

  // Navigation
  readonly currentPhase = this.#machine.currentPhase;
  readonly highestVisitedPhase = this.#machine.highestVisitedPhase;
  readonly revealedPhases = this.#machine.revealedPhases;
  readonly flowMode = this.#machine.flowMode;
  readonly isDiscoveryMode = this.#machine.isDiscoveryMode;
  readonly currentPhaseLabel = this.#machine.currentPhaseLabel;
  readonly completedPhases = this.#machine.completedPhases;

  // Data
  readonly quickData = this.#machine.quickData;
  readonly presentationData = this.#machine.presentationData;
  readonly coldDrawData = this.#machine.coldDrawData;
  readonly firstThirdData = this.#machine.firstThirdData;
  readonly secondThirdData = this.#machine.secondThirdData;
  readonly finalThirdData = this.#machine.finalThirdData;
  readonly conclusionLocalData = this.#machine.conclusionData;
  readonly finaleData = this.#machine.finaleData;

  // UI
  readonly showDraftConfirmation = this.#machine.showDraftConfirmation;
  readonly showDiscoveryBottomSheet = this.#machine.showDiscoveryBottomSheet;
  readonly showExitConfirmation = this.#machine.showExitConfirmation;
  readonly showConfirmation = this.#machine.showCompletionModal;
  readonly isCompleting = this.#machine.isCompleting;
  readonly isRestoringDraft = this.#machine.isRestoringDraft;

  // Validation
  readonly isPhase1Completed = this.#machine.isPhase1Completed;

  /**
   * Can complete tasting?
   * Uses reactive ratingSignal from FormService
   */
  readonly canComplete = computed(() => {
    const rating = this.#formService.ratingSignal();
    return rating > 0;
  });

  /**
   * Elapsed time (format MM:SS)
   */
  readonly elapsedTime = computed(() => {
    const elapsed = Math.floor((Date.now() - this.#startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  });

  /**
   * Draft cigar (for backward compatibility)
   */
  readonly draftCigar = computed(() => {
    const draft = this.existingDraft();
    return draft?.cigar ?? null;
  });

  // ==================== Observations (Reactive Query) ====================

  /**
   * Load observations for this tasting (reactive)
   */
  readonly observations = this.#observationStore.getObservationsByTasting(() => this.tastingId() || '');

  /**
   * Extract conclusion data from observations
   */
  readonly conclusionData = computed(() => {
    const observations = this.observations.data() ?? [];
    const conclusionObs = observations.find((obs) => obs.phase === 'conclusion');
    if (!conclusionObs?.organoleptic?.['conclusion']) return null;

    const data = conclusionObs.organoleptic['conclusion'] as Record<string, unknown>;
    return {
      draw: data['draw'] || null,
      ashNature: data['ashNature'] || null,
      balance: data['balance'] || null,
      terroir: data['terroir'] || null,
      power: (data['power'] as number) || 5,
      variety: (data['variety'] as number) || 5,
      mouthImpression: (data['mouthImpression'] as string[]) || [],
      persistence: data['persistence'] || null,
    };
  });

  // ==================== Constructor ====================

  constructor() {
    // Start dynamic timer
    this.#timerInterval = setInterval(() => {
      // Timer updates are handled by elapsedTime computed
    }, 1000);
  }

  // ==================== Navigation Helpers ====================

  isPhaseRevealed(phase: TastingPhase): boolean {
    return this.#machine.isPhaseRevealed(phase);
  }

  isPhaseAccessible(phase: TastingPhase): boolean {
    return this.#machine.isPhaseAccessible(phase);
  }

  getPhaseState(phase: TastingPhase): 'locked' | 'accessible' | 'active' | 'completed' {
    return this.#machine.getPhaseState(phase);
  }

  getPhaseIndex(phase: TastingPhase): number {
    return this.#machine.getPhaseIndex(phase);
  }

  navigateToPhase(phase: TastingPhase): void {
    if (!this.isPhaseAccessible(phase)) {
      this.#toast.warning('Cette phase n\'est pas encore accessible');
      return;
    }

    this.#machine.dispatch({ type: 'NAVIGATE_TO_PHASE', phase });
    this.#scroll.scrollTo(`phase-${phase.replace('_', '-')}`);
  }

  // ==================== Lifecycle ====================

  async createOrLoadDraft(cigarId?: string | null, eventId?: string | null): Promise<void> {
    if (this.tastingId()) {
      this.#autoSave.setTastingId(this.tastingId()!);
      return;
    }

    try {
      const params: Record<string, unknown> = {
        limit: 100,
        page: 1,
        status: 'DRAFT',
        sortBy: 'date',
        order: 'desc',
      };

      if (cigarId && cigarId !== 'null' && cigarId !== 'undefined') {
        params['cigarId'] = cigarId;
      }

      const response = await this.#tastingsService.tastingControllerFindMine(params);
      const existingDrafts = response?.data ?? [];

      if (existingDrafts.length > 0) {
        const draft = existingDrafts[0];
        this.#machine.dispatch({ type: 'DRAFT_FOUND', draft });
        return;
      }

      if (cigarId && cigarId !== 'null' && cigarId !== 'undefined') {
        await this.#createNewDraft(cigarId, eventId);
      } else {
        this.#machine.setEventId(eventId || null);
        this.#autoSave.saveStatus.set('');
      }
    } catch {
      this.#autoSave.saveStatus.set('Erreur');
    }
  }

  async continueDraft(): Promise<void> {
    const draft = this.existingDraft();
    if (!draft) return;

    this.#machine.dispatch({ type: 'CONTINUE_DRAFT' });

    // Configure auto-save
    this.#autoSave.setTastingId(draft.id);

    // Restore finale form
    if (draft.rating && draft.rating > 0) {
      this.#formService.patchFinaleData({
        rating: draft.rating,
        comment: draft.comment || '',
      });
    }

    // Restore observations - wait for query to complete
    this.#waitForObservationsAndRestore();

    this.#toast.info('Reprise du rituel précédent...');
  }

  /**
   * Wait for observations query to complete, then restore
   * Polls every 100ms with a max timeout of 5 seconds
   */
  #waitForObservationsAndRestore(): void {
    const maxAttempts = 50; // 50 * 100ms = 5 seconds max
    let attempts = 0;

    const checkAndRestore = (): void => {
      attempts++;
      const loading = this.observations.loading();

      if (!loading) {
        this.#restoreObservationsData();
      } else if (attempts < maxAttempts) {
        setTimeout(checkAndRestore, 100);
      } else {
        this.#restoreObservationsData();
      }
    };

    // Start checking after initial delay (let query start)
    setTimeout(checkAndRestore, 200);
  }

  #restoreObservationsData(): void {
    const observations = this.observations.data() ?? [];

    if (observations.length === 0) {
      this.#machine.dispatch({ type: 'END_RESTORATION' });
      return;
    }

    // Transform observations for state machine
    const observationsData = observations.map(obs => ({
      phase: obs.phase,
      organoleptic: obs.organoleptic as Record<string, unknown> | undefined,
    }));

    this.#machine.dispatch({
      type: 'RESTORE_OBSERVATIONS',
      observations: observationsData,
    });
  }

  async createNewAndDeleteDraft(cigarId?: string | null, eventId?: string | null): Promise<void> {
    const draft = this.existingDraft();

    this.#machine.dispatch({ type: 'START_NEW', cigarId: cigarId || undefined, eventId: eventId || undefined });

    if (draft) {
      try {
        await this.#tastingStore.deleteTasting.mutate(draft.id);
      } catch {
        // Silently ignore deletion errors
      }
    }

    if (cigarId && cigarId !== 'null' && cigarId !== 'undefined') {
      await this.#createNewDraft(cigarId, eventId);
    } else {
      this.#autoSave.saveStatus.set('');
    }
  }

  async #createNewDraft(cigarId: string, eventId?: string | null, clubId?: string): Promise<void> {
    this.#autoSave.saveStatus.set('Création...');

    const context = this.#contextStore.context();
    const createDto: CreateTastingDto = {
      cigarId,
      eventId: eventId && eventId !== 'null' && eventId !== 'undefined' ? eventId : undefined,
      clubId: clubId || undefined,
    };

    let defaultLocation = 'Chez moi';
    if (context.type === 'club' && context.club) {
      defaultLocation = context.club.name;
    }

    const result = await this.#tastingStore.createTasting.mutate(createDto);

    if (result) {
      this.#machine.dispatch({
        type: 'TASTING_CREATED',
        tastingId: result.id,
        cigar: result.cigar || undefined,
      });

      this.#autoSave.setTastingId(result.id);

      // Auto-save initial location
      this.#autoSave.saveTastingData({ location: defaultLocation });
      this.#autoSave.saveStatus.set('');
    }
  }

  async completeTasting(): Promise<void> {
    const id = this.tastingId();

    if (!id) {
      this.#toast.warning('Erreur: Tasting introuvable');
      return;
    }

    const finaleData = this.#formService.getCompleteTastingData();

    if (!finaleData.rating || finaleData.rating < 0.5) {
      this.#toast.warning('Veuillez donner une note avant de terminer');
      return;
    }

    try {
      this.#machine.dispatch({ type: 'START_COMPLETING' });
      this.#autoSave.saveStatus.set('Finalisation...');

      const completeDto: CompleteTastingDto = {
        rating: finaleData.rating,
        comment: finaleData.comment || undefined,
      };

      await this.#tastingStore.completeTasting.mutate({ id, data: completeDto });

      // Clean up any remaining drafts after successful completion
      await this.#cleanupRemainingDrafts(id);

      if ('vibrate' in navigator) {
        navigator.vibrate([50, 100, 50]);
      }

      this.#autoSave.saveStatus.set('Terminé');
      this.#machine.dispatch({ type: 'COMPLETE_TASTING_SUCCESS' });
    } catch {
      this.#autoSave.saveStatus.set('Erreur');
      this.#machine.dispatch({ type: 'COMPLETE_TASTING_ERROR' });
      this.#toast.error('Erreur lors de la finalisation');
    }
  }

  /**
   * Clean up any remaining drafts after successful completion
   * Deletes all DRAFT tastings except the one that was just completed
   */
  async #cleanupRemainingDrafts(completedTastingId: string): Promise<void> {
    try {
      const response = await this.#tastingsService.tastingControllerFindMine({
        limit: 100,
        page: 1,
        status: 'DRAFT',
      });

      const drafts = response?.data ?? [];

      // Delete all remaining drafts (shouldn't include the completed one, but filter just in case)
      const draftsToDelete = drafts.filter(d => d.id !== completedTastingId);

      if (draftsToDelete.length > 0) {
        console.log(`[TASTING] Cleaning up ${draftsToDelete.length} remaining draft(s)`);
        await Promise.all(
          draftsToDelete.map(draft => this.#tastingStore.deleteTasting.mutate(draft.id))
        );
      }
    } catch (error) {
      // Silent fail - cleanup is not critical
      console.warn('[TASTING] Failed to cleanup remaining drafts:', error);
    }
  }

  // ==================== Flow Management ====================

  handleCtaA_Verdict(): void {
    this.#machine.dispatch({ type: 'GO_TO_VERDICT' });
    this.#scroll.scrollTo('phase-finale');
  }

  /**
   * Skip directly to finale (escape hatch)
   * Bypasses accessibility check - always allowed in chronique mode
   */
  skipToFinale(): void {
    this.#machine.dispatch({ type: 'GO_TO_VERDICT' });
    this.#scroll.scrollTo('phase-finale');
  }

  async handleCtaB_Chronique(): Promise<void> {
    if (this.#planService.isPremium()) {
      this.#machine.dispatch({ type: 'START_CHRONIQUE', isDiscovery: false });
      this.#scroll.scrollTo('phase-presentation');
    } else {
      this.#machine.dispatch({ type: 'SHOW_DISCOVERY_BOTTOM_SHEET', show: true });
    }
  }

  async handleDiscovery_Confirm(): Promise<void> {
    this.#machine.dispatch({ type: 'START_CHRONIQUE', isDiscovery: true });
    this.#scroll.scrollTo('phase-presentation');
  }

  handleDiscovery_Cancel(): void {
    this.#machine.dispatch({ type: 'SHOW_DISCOVERY_BOTTOM_SHEET', show: false });
    this.handleCtaA_Verdict();
  }

  handleDiscovery_UpgradePremium(): void {
    this.#machine.dispatch({ type: 'SHOW_DISCOVERY_BOTTOM_SHEET', show: false });
    this.#toast.info('Fonctionnalité Premium à venir');
  }

  // ==================== Data Management ====================

  async updateQuickData(data: UpdateTastingDto & { cigarName?: string; clubId?: string; clubName?: string }): Promise<void> {
    const isValidUuid = data.cigarId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.cigarId);

    if (!this.tastingId() && isValidUuid && data.cigarId) {
      await this.#createNewDraft(data.cigarId, this.eventId(), data.clubId);
    }

    this.#machine.dispatch({
      type: 'UPDATE_QUICK_DATA',
      data: {
        cigarId: data.cigarId || null,
        cigarName: data.cigarName || null,
        moment: data.moment || null,
        situation: data.situation || null,
        pairing: data.pairing || null,
        pairingNote: data.pairingNote || '',
        location: data.location || '',
        clubId: data.clubId || null,
        clubName: data.clubName || null,
      },
    });

    if (this.tastingId()) {
      const { cigarName, clubName, ...backendData } = data;
      this.#autoSave.saveTastingData(backendData);
    }
  }

  updateFinaleData(data: { rating: number; comment: string }): void {
    this.#machine.dispatch({
      type: 'UPDATE_FINALE_DATA',
      data,
    });
  }

  updatePresentationData(data: {
    wrapperAspect?: string | null;
    wrapperColor?: string | null;
    touch?: string | null;
  }): void {
    this.#machine.dispatch({
      type: 'UPDATE_PRESENTATION_DATA',
      data: {
        wrapperAspect: data.wrapperAspect as CapeAspect | null | undefined,
        wrapperColor: data.wrapperColor as CapeColor | null | undefined,
        touch: data.touch as CapeTouch | null | undefined,
      },
    });
  }

  updateColdDrawData(data: {
    tastes?: FlavorTag[];
    aromas?: FlavorTag[];
    notes?: string;
  }): void {
    this.#machine.dispatch({
      type: 'UPDATE_COLD_DRAW_DATA',
      data,
    });
  }

  updateFirstThirdData(data: { tastes?: FlavorTag[]; aromas?: FlavorTag[] }): void {
    this.#machine.dispatch({
      type: 'UPDATE_TERCIO_DATA',
      tercio: 'firstThird',
      data,
    });
  }

  updateSecondThirdData(data: { tastes?: FlavorTag[]; aromas?: FlavorTag[] }): void {
    this.#machine.dispatch({
      type: 'UPDATE_TERCIO_DATA',
      tercio: 'secondThird',
      data,
    });
  }

  updateFinalThirdData(data: { tastes?: FlavorTag[]; aromas?: FlavorTag[] }): void {
    this.#machine.dispatch({
      type: 'UPDATE_TERCIO_DATA',
      tercio: 'finalThird',
      data,
    });
  }

  updateConclusionLocalData(data: {
    draw?: string | null;
    ashNature?: string | null;
    balance?: string | null;
    terroir?: string | null;
    power?: number;
    variety?: number;
    mouthImpression?: string[];
    persistence?: string | null;
  }): void {
    this.#machine.dispatch({
      type: 'UPDATE_CONCLUSION_DATA',
      data: {
        draw: data.draw as Draw | null | undefined,
        ashNature: data.ashNature as AshNature | null | undefined,
        balance: data.balance as Balance | null | undefined,
        terroir: data.terroir as Terroir | null | undefined,
        power: data.power,
        variety: data.variety,
        mouthImpression: data.mouthImpression as MouthImpression[] | undefined,
        persistence: data.persistence as Persistence | null | undefined,
      },
    });
  }

  updateObservation(phase: string, data: Record<string, unknown>): void {
    this.#autoSave.saveObservation(
      phase,
      { organoleptic: data },
      this.isDiscoveryMode()
    );
  }

  // ==================== Navigation ====================

  scrollToPhase(phaseId: string): void {
    this.#scroll.scrollTo(phaseId);
  }

  async handleNextAction(): Promise<void> {
    const phase = this.currentPhase();

    switch (phase) {
      case 'quick':
        await this.handleCtaB_Chronique();
        break;
      case 'finale':
        await this.completeTasting();
        break;
      default:
        this.#scrollToNextPhase();
        break;
    }
  }

  #scrollToNextPhase(): void {
    const phaseOrder: TastingPhase[] = [
      'quick',
      'presentation',
      'cold_draw',
      'first_third',
      'second_third',
      'final_third',
      'conclusion',
      'finale',
    ];

    const currentIndex = phaseOrder.indexOf(this.currentPhase());
    if (currentIndex >= 0 && currentIndex < phaseOrder.length - 1) {
      const nextPhase = phaseOrder[currentIndex + 1];
      this.#scroll.scrollTo(`phase-${nextPhase.replace('_', '-')}`);
    }
  }

  viewTasting(): void {
    const id = this.tastingId();
    if (id) {
      void this.#router.navigate(['/tastings', id]);
    }
  }

  close(): void {
    void this.#router.navigate(['/dashboard']);
  }

  handleBack(): void {
    if (this.showConfirmation()) {
      this.close();
    } else {
      this.#machine.dispatch({ type: 'SHOW_EXIT_CONFIRMATION', show: true });
    }
  }

  confirmExit(): void {
    this.#machine.dispatch({ type: 'SHOW_EXIT_CONFIRMATION', show: false });
    this.close();
  }

  cancelExit(): void {
    this.#machine.dispatch({ type: 'SHOW_EXIT_CONFIRMATION', show: false });
  }

  closeDraftConfirmation(): void {
    this.#machine.dispatch({ type: 'SHOW_DRAFT_CONFIRMATION', show: false });
  }

  closeDiscoveryBottomSheet(): void {
    this.#machine.dispatch({ type: 'SHOW_DISCOVERY_BOTTOM_SHEET', show: false });
  }

  /**
   * Set current phase (used by scroll observer)
   * Guards against unnecessary dispatches to prevent infinite loops
   */
  setCurrentPhase(phase: TastingPhase): void {
    // Guard: Don't dispatch if phase is already current (prevents infinite loop)
    if (phase === this.currentPhase()) {
      return;
    }
    this.#machine.dispatch({ type: 'NAVIGATE_TO_PHASE', phase });
  }

  /**
   * Mark quick phase as completed (shows decision card)
   */
  markQuickPhaseCompleted(): void {
    this.#machine.dispatch({ type: 'QUICK_PHASE_COMPLETED' });
  }

  // ==================== Cleanup ====================

  async flush(): Promise<void> {
    await this.#autoSave.flush();
  }

  ngOnDestroy(): void {
    if (this.#timerInterval) {
      clearInterval(this.#timerInterval);
      this.#timerInterval = null;
    }
  }
}
