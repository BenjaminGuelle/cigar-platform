import { Injectable, signal, computed } from '@angular/core';
import type { TastingEvent } from '../models/tasting-events.model';
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
import {
  type TastingState,
  type TastingPhase,
  type FlavorTag,
  createInitialTastingState,
  CHRONIQUE_PHASES,
  PHASE_ORDER,
  getPhaseIndex,
  getNextPhase,
  isPhaseAccessible,
} from '../models/tasting-state.model';

/**
 * Tasting State Machine Service
 *
 * ALL STARS Architecture ⭐
 * - Single Source of Truth for tasting state
 * - Typed events for all transitions
 * - Pure reducer function for predictable state changes
 * - Computed signals for derived state
 *
 * @example
 * ```typescript
 * const machine = inject(TastingStateMachine);
 *
 * // Dispatch an event
 * machine.dispatch({ type: 'START_CHRONIQUE', isDiscovery: false });
 *
 * // Read state
 * const phase = machine.currentPhase();
 * const canComplete = machine.canComplete();
 * ```
 */
@Injectable()
export class TastingStateMachine {
  // ==================== Core State ====================

  readonly #state = signal<TastingState>(createInitialTastingState());

  /**
   * Current state (read-only)
   */
  readonly state = this.#state.asReadonly();

  // ==================== Computed - Identity ====================

  readonly tastingId = computed(() => this.#state().tastingId);
  readonly cigarId = computed(() => this.#state().cigarId);
  readonly eventId = computed(() => this.#state().eventId);
  readonly existingDraft = computed(() => this.#state().existingDraft);
  readonly confirmedDraftCigar = computed(() => this.#state().confirmedDraftCigar);

  // ==================== Computed - Navigation ====================

  readonly currentPhase = computed(() => this.#state().currentPhase);
  readonly highestVisitedPhase = computed(() => this.#state().highestVisitedPhase);
  readonly revealedPhases = computed(() => this.#state().revealedPhases);
  readonly flowMode = computed(() => this.#state().flowMode);
  readonly isDiscoveryMode = computed(() => this.#state().isDiscoveryMode);

  readonly currentPhaseLabel = computed(() => {
    const labels: Record<TastingPhase, string> = {
      quick: 'L\'Entrée en Matière',
      presentation: 'Présentation',
      cold_draw: 'Fumage à cru',
      first_third: 'L\'Éveil',
      second_third: 'La Plénitude',
      final_third: 'L\'Intensité',
      conclusion: 'Conclusion',
      finale: 'Le Dernier Mot',
      confirmation: 'Confirmation',
    };
    return labels[this.#state().currentPhase];
  });

  readonly completedPhases = computed((): TastingPhase[] => {
    const currentIndex = getPhaseIndex(this.#state().currentPhase);
    return PHASE_ORDER.filter((_, index) => index < currentIndex);
  });

  // ==================== Computed - Data ====================

  readonly data = computed(() => this.#state().data);
  readonly quickData = computed(() => this.#state().data.quick);
  readonly presentationData = computed(() => this.#state().data.presentation);
  readonly coldDrawData = computed(() => this.#state().data.coldDraw);
  readonly firstThirdData = computed(() => this.#state().data.firstThird);
  readonly secondThirdData = computed(() => this.#state().data.secondThird);
  readonly finalThirdData = computed(() => this.#state().data.finalThird);
  readonly conclusionData = computed(() => this.#state().data.conclusion);
  readonly finaleData = computed(() => this.#state().data.finale);

  // ==================== Computed - UI ====================

  readonly ui = computed(() => this.#state().ui);
  readonly showDraftConfirmation = computed(() => this.#state().ui.showDraftConfirmation);
  readonly showDiscoveryBottomSheet = computed(() => this.#state().ui.showDiscoveryBottomSheet);
  readonly showExitConfirmation = computed(() => this.#state().ui.showExitConfirmation);
  readonly showCompletionModal = computed(() => this.#state().ui.showCompletionModal);
  readonly showDecisionCard = computed(() => this.#state().ui.showDecisionCard);
  readonly isCompleting = computed(() => this.#state().ui.isCompleting);
  readonly isRestoringDraft = computed(() => this.#state().ui.isRestoringDraft);

  // ==================== Computed - Validation ====================

  readonly canComplete = computed(() => {
    return this.#state().data.finale.rating > 0;
  });

  readonly isPhase1Completed = computed(() => {
    const quick = this.#state().data.quick;
    return !!quick.cigarId && !!quick.situation;
  });

  // ==================== Computed - Timer ====================

  readonly startTime = computed(() => this.#state().startTime);

  // ==================== Dispatch ====================

  /**
   * Dispatch an event to the state machine
   */
  dispatch(event: TastingEvent): void {
    const currentState = this.#state();
    const nextState = this.#reducer(currentState, event);
    this.#state.set(nextState);
  }

  // ==================== Reducer ====================

  #reducer(state: TastingState, event: TastingEvent): TastingState {
    switch (event.type) {
      // ==================== Draft ====================

      case 'DRAFT_FOUND':
        return {
          ...state,
          existingDraft: event.draft,
          ui: { ...state.ui, showDraftConfirmation: true },
        };

      case 'CONTINUE_DRAFT': {
        const draft = state.existingDraft;
        if (!draft) return state;

        const newState = {
          ...state,
          tastingId: draft.id,
          cigarId: draft.cigarId,
          eventId: draft.eventId || null,
          confirmedDraftCigar: draft.cigar || null,
          data: {
            ...state.data,
            quick: {
              cigarId: draft.cigarId,
              cigarName: draft.cigar?.name || null,
              moment: draft.moment || null,
              situation: draft.situation || null,
              pairing: draft.pairing || null,
              pairingNote: draft.pairingNote || '',
              location: draft.location || 'Chez moi',
              clubId: null, // Draft doesn't store club association
              clubName: null,
            },
            finale: {
              rating: draft.rating || 0,
              comment: draft.comment || '',
            },
          },
          ui: {
            ...state.ui,
            showDraftConfirmation: false,
            isRestoringDraft: true,
          },
        };

        return newState;
      }

      case 'START_NEW':
        return {
          ...createInitialTastingState(),
          cigarId: event.cigarId || null,
          eventId: event.eventId || null,
        };

      case 'TASTING_CREATED':
        return {
          ...state,
          tastingId: event.tastingId,
          confirmedDraftCigar: event.cigar || null,
        };

      // ==================== Navigation ====================

      case 'NAVIGATE_TO_PHASE': {
        // Guard: Don't create new state if phase is already current (performance + prevents loops)
        if (event.phase === state.currentPhase) {
          return state;
        }

        if (!isPhaseAccessible(event.phase, state.highestVisitedPhase)) {
          return state;
        }

        const targetIndex = getPhaseIndex(event.phase);
        const highestIndex = getPhaseIndex(state.highestVisitedPhase);

        return {
          ...state,
          currentPhase: event.phase,
          highestVisitedPhase: targetIndex > highestIndex ? event.phase : state.highestVisitedPhase,
        };
      }

      case 'START_CHRONIQUE': {
        const newRevealed = new Set(state.revealedPhases);
        CHRONIQUE_PHASES.forEach(phase => newRevealed.add(phase));

        return {
          ...state,
          flowMode: 'chronique',
          isDiscoveryMode: event.isDiscovery,
          currentPhase: 'presentation',
          highestVisitedPhase: 'presentation',
          revealedPhases: newRevealed,
          ui: {
            ...state.ui,
            showDecisionCard: false,
            showDiscoveryBottomSheet: false,
          },
        };
      }

      case 'GO_TO_VERDICT':
        return {
          ...state,
          flowMode: 'quick',
          currentPhase: 'finale',
          highestVisitedPhase: 'finale',
          ui: { ...state.ui, showDecisionCard: false },
        };

      // ==================== Phase Completion ====================

      case 'QUICK_PHASE_COMPLETED':
        return {
          ...state,
          highestVisitedPhase: 'finale',
          ui: { ...state.ui, showDecisionCard: true },
        };

      case 'PHASE_COMPLETED': {
        const nextPhase = getNextPhase(event.phase);
        if (!nextPhase) return state;

        return {
          ...state,
          currentPhase: nextPhase,
          highestVisitedPhase: nextPhase,
        };
      }

      // ==================== Data Updates ====================

      case 'UPDATE_QUICK_DATA':
        return {
          ...state,
          data: {
            ...state.data,
            quick: { ...state.data.quick, ...event.data },
          },
        };

      case 'UPDATE_PRESENTATION_DATA':
        return {
          ...state,
          data: {
            ...state.data,
            presentation: { ...state.data.presentation, ...event.data },
          },
        };

      case 'UPDATE_COLD_DRAW_DATA':
        return {
          ...state,
          data: {
            ...state.data,
            coldDraw: { ...state.data.coldDraw, ...event.data },
          },
        };

      case 'UPDATE_TERCIO_DATA':
        return {
          ...state,
          data: {
            ...state.data,
            [event.tercio]: { ...state.data[event.tercio], ...event.data },
          },
        };

      case 'UPDATE_CONCLUSION_DATA':
        return {
          ...state,
          data: {
            ...state.data,
            conclusion: { ...state.data.conclusion, ...event.data },
          },
        };

      case 'UPDATE_FINALE_DATA':
        return {
          ...state,
          data: {
            ...state.data,
            finale: { ...state.data.finale, ...event.data },
          },
        };

      // ==================== UI ====================

      case 'SHOW_DRAFT_CONFIRMATION':
        return {
          ...state,
          ui: { ...state.ui, showDraftConfirmation: event.show },
        };

      case 'SHOW_DISCOVERY_BOTTOM_SHEET':
        return {
          ...state,
          ui: { ...state.ui, showDiscoveryBottomSheet: event.show },
        };

      case 'SHOW_EXIT_CONFIRMATION':
        return {
          ...state,
          ui: { ...state.ui, showExitConfirmation: event.show },
        };

      case 'SHOW_DECISION_CARD':
        return {
          ...state,
          ui: { ...state.ui, showDecisionCard: event.show },
        };

      // ==================== Completion ====================

      case 'START_COMPLETING':
        return {
          ...state,
          ui: { ...state.ui, isCompleting: true },
        };

      case 'COMPLETE_TASTING_SUCCESS':
        return {
          ...state,
          existingDraft: null,
          confirmedDraftCigar: null,
          ui: {
            ...state.ui,
            isCompleting: false,
            showCompletionModal: true,
          },
        };

      case 'COMPLETE_TASTING_ERROR':
        return {
          ...state,
          ui: { ...state.ui, isCompleting: false },
        };

      // ==================== Restoration ====================

      case 'START_RESTORATION':
        return {
          ...state,
          ui: { ...state.ui, isRestoringDraft: true },
        };

      case 'END_RESTORATION':
        return {
          ...state,
          ui: { ...state.ui, isRestoringDraft: false },
        };

      case 'RESTORE_OBSERVATIONS': {
        let newState = { ...state };
        let lastCompletedPhaseIndex = -1;

        event.observations.forEach(obs => {
          const organoleptic = obs.organoleptic;
          if (!organoleptic) return;

          const phaseIndex = CHRONIQUE_PHASES.indexOf(obs.phase as TastingPhase);
          if (phaseIndex > lastCompletedPhaseIndex) {
            lastCompletedPhaseIndex = phaseIndex;
          }

          switch (obs.phase) {
            case 'presentation':
              if (organoleptic['presentation']) {
                const data = organoleptic['presentation'] as Record<string, unknown>;
                newState = {
                  ...newState,
                  data: {
                    ...newState.data,
                    presentation: {
                      wrapperAspect: (data['wrapperAspect'] as CapeAspect) || null,
                      wrapperColor: (data['wrapperColor'] as CapeColor) || null,
                      touch: (data['touch'] as CapeTouch) || null,
                    },
                  },
                };
              }
              break;

            case 'cold_draw':
              if (organoleptic['coldDraw']) {
                const data = organoleptic['coldDraw'] as Record<string, unknown>;
                newState = {
                  ...newState,
                  data: {
                    ...newState.data,
                    coldDraw: {
                      tastes: (data['tastes'] as FlavorTag[]) || [],
                      aromas: (data['aromas'] as FlavorTag[]) || [],
                      notes: (data['notes'] as string) || '',
                    },
                  },
                };
              }
              break;

            case 'first_third':
              if (organoleptic['firstThird']) {
                const data = organoleptic['firstThird'] as Record<string, unknown>;
                newState = {
                  ...newState,
                  data: {
                    ...newState.data,
                    firstThird: {
                      tastes: (data['tastes'] as FlavorTag[]) || [],
                      aromas: (data['aromas'] as FlavorTag[]) || [],
                    },
                  },
                };
              }
              break;

            case 'second_third':
              if (organoleptic['secondThird']) {
                const data = organoleptic['secondThird'] as Record<string, unknown>;
                newState = {
                  ...newState,
                  data: {
                    ...newState.data,
                    secondThird: {
                      tastes: (data['tastes'] as FlavorTag[]) || [],
                      aromas: (data['aromas'] as FlavorTag[]) || [],
                    },
                  },
                };
              }
              break;

            case 'final_third':
              if (organoleptic['finalThird']) {
                const data = organoleptic['finalThird'] as Record<string, unknown>;
                newState = {
                  ...newState,
                  data: {
                    ...newState.data,
                    finalThird: {
                      tastes: (data['tastes'] as FlavorTag[]) || [],
                      aromas: (data['aromas'] as FlavorTag[]) || [],
                    },
                  },
                };
              }
              break;

            case 'conclusion':
              if (organoleptic['conclusion']) {
                const data = organoleptic['conclusion'] as Record<string, unknown>;
                newState = {
                  ...newState,
                  data: {
                    ...newState.data,
                    conclusion: {
                      draw: (data['draw'] as Draw) || null,
                      ashNature: (data['ashNature'] as AshNature) || null,
                      balance: (data['balance'] as Balance) || null,
                      terroir: (data['terroir'] as Terroir) || null,
                      power: (data['power'] as number) || 5,
                      variety: (data['variety'] as number) || 5,
                      mouthImpression: (data['mouthImpression'] as MouthImpression[]) || [],
                      persistence: (data['persistence'] as Persistence) || null,
                    },
                  },
                };
              }
              break;
          }
        });

        // Update navigation based on restored phases
        if (lastCompletedPhaseIndex >= 0) {
          const newRevealed = new Set(newState.revealedPhases);
          CHRONIQUE_PHASES.forEach(phase => newRevealed.add(phase));

          // Determine next phase
          const nextPhaseIndex = lastCompletedPhaseIndex + 1;
          const nextPhase = nextPhaseIndex >= CHRONIQUE_PHASES.length
            ? 'finale'
            : CHRONIQUE_PHASES[nextPhaseIndex];

          newState = {
            ...newState,
            flowMode: 'chronique',
            revealedPhases: newRevealed,
            currentPhase: nextPhase,
            highestVisitedPhase: nextPhase,
          };
        } else {
          // No chronique phases - unlock finale
          newState = {
            ...newState,
            highestVisitedPhase: 'finale',
          };
        }

        // End restoration
        newState = {
          ...newState,
          ui: { ...newState.ui, isRestoringDraft: false },
        };

        return newState;
      }

      default:
        return state;
    }
  }

  // ==================== Helpers ====================

  /**
   * Check if a phase is revealed
   */
  isPhaseRevealed(phase: TastingPhase): boolean {
    return this.#state().revealedPhases.has(phase);
  }

  /**
   * Check if a phase is accessible
   */
  isPhaseAccessible(phase: TastingPhase): boolean {
    return isPhaseAccessible(phase, this.#state().highestVisitedPhase);
  }

  /**
   * Get phase state (for timeline)
   */
  getPhaseState(phase: TastingPhase): 'locked' | 'accessible' | 'active' | 'completed' {
    const state = this.#state();
    const currentIndex = getPhaseIndex(state.currentPhase);
    const phaseIndex = getPhaseIndex(phase);

    if (phase === state.currentPhase) return 'active';
    if (phaseIndex < currentIndex) return 'completed';
    if (this.isPhaseAccessible(phase)) return 'accessible';
    return 'locked';
  }

  /**
   * Get phase index
   */
  getPhaseIndex(phase: TastingPhase): number {
    return getPhaseIndex(phase);
  }

  /**
   * Reset state to initial
   */
  reset(): void {
    this.#state.set(createInitialTastingState());
  }

  /**
   * Set tasting ID (after creation)
   */
  setTastingId(id: string): void {
    this.#state.update(s => ({ ...s, tastingId: id }));
  }

  /**
   * Set event ID
   */
  setEventId(id: string | null): void {
    this.#state.update(s => ({ ...s, eventId: id }));
  }
}
