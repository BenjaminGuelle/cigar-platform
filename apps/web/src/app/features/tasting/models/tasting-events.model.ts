import type { TastingResponseDto, CigarResponseDto } from '@cigar-platform/types';
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
import type {
  TastingPhase,
  QuickPhaseData,
  PresentationPhaseData,
  ColdDrawPhaseData,
  TercioPhaseData,
  ConclusionPhaseData,
  FinalePhaseData,
} from './tasting-state.model';

/**
 * Tasting Events - State Machine Transitions
 *
 * ALL STARS Architecture ⭐
 * - Typed events for all state transitions
 * - Each event represents a user action or system event
 * - Reducer handles state changes based on events
 */

// ==================== Draft Events ====================

export interface DraftFoundEvent {
  type: 'DRAFT_FOUND';
  draft: TastingResponseDto;
}

export interface ContinueDraftEvent {
  type: 'CONTINUE_DRAFT';
}

export interface StartNewEvent {
  type: 'START_NEW';
  cigarId?: string;
  eventId?: string;
}

export interface TastingCreatedEvent {
  type: 'TASTING_CREATED';
  tastingId: string;
  cigar?: CigarResponseDto;
}

// ==================== Phase Navigation Events ====================

export interface NavigateToPhaseEvent {
  type: 'NAVIGATE_TO_PHASE';
  phase: TastingPhase;
}

export interface StartChroniqueEvent {
  type: 'START_CHRONIQUE';
  isDiscovery: boolean;
}

export interface GoToVerdictEvent {
  type: 'GO_TO_VERDICT';
}

// ==================== Phase Completion Events ====================

export interface QuickPhaseCompletedEvent {
  type: 'QUICK_PHASE_COMPLETED';
}

export interface PhaseCompletedEvent {
  type: 'PHASE_COMPLETED';
  phase: TastingPhase;
}

// ==================== Data Update Events ====================

export interface UpdateQuickDataEvent {
  type: 'UPDATE_QUICK_DATA';
  data: Partial<QuickPhaseData>;
}

export interface UpdatePresentationDataEvent {
  type: 'UPDATE_PRESENTATION_DATA';
  data: Partial<PresentationPhaseData>;
}

export interface UpdateColdDrawDataEvent {
  type: 'UPDATE_COLD_DRAW_DATA';
  data: Partial<ColdDrawPhaseData>;
}

export interface UpdateTercioDataEvent {
  type: 'UPDATE_TERCIO_DATA';
  tercio: 'firstThird' | 'secondThird' | 'finalThird';
  data: Partial<TercioPhaseData>;
}

export interface UpdateConclusionDataEvent {
  type: 'UPDATE_CONCLUSION_DATA';
  data: Partial<ConclusionPhaseData>;
}

export interface UpdateFinaleDataEvent {
  type: 'UPDATE_FINALE_DATA';
  data: Partial<FinalePhaseData>;
}

// ==================== UI Events ====================

export interface ShowDraftConfirmationEvent {
  type: 'SHOW_DRAFT_CONFIRMATION';
  show: boolean;
}

export interface ShowDiscoveryBottomSheetEvent {
  type: 'SHOW_DISCOVERY_BOTTOM_SHEET';
  show: boolean;
}

export interface ShowExitConfirmationEvent {
  type: 'SHOW_EXIT_CONFIRMATION';
  show: boolean;
}

export interface ShowDecisionCardEvent {
  type: 'SHOW_DECISION_CARD';
  show: boolean;
}

// ==================== Completion Events ====================

export interface StartCompletingEvent {
  type: 'START_COMPLETING';
}

export interface CompleteTastingSuccessEvent {
  type: 'COMPLETE_TASTING_SUCCESS';
}

export interface CompleteTastingErrorEvent {
  type: 'COMPLETE_TASTING_ERROR';
}

// ==================== Restoration Events ====================

export interface StartRestorationEvent {
  type: 'START_RESTORATION';
}

export interface EndRestorationEvent {
  type: 'END_RESTORATION';
}

export interface RestoreObservationsEvent {
  type: 'RESTORE_OBSERVATIONS';
  observations: Array<{
    phase: string;
    organoleptic?: Record<string, unknown>;
  }>;
}

// ==================== Union Type ====================

export type TastingEvent =
  // Draft
  | DraftFoundEvent
  | ContinueDraftEvent
  | StartNewEvent
  | TastingCreatedEvent
  // Navigation
  | NavigateToPhaseEvent
  | StartChroniqueEvent
  | GoToVerdictEvent
  // Phase Completion
  | QuickPhaseCompletedEvent
  | PhaseCompletedEvent
  // Data Updates
  | UpdateQuickDataEvent
  | UpdatePresentationDataEvent
  | UpdateColdDrawDataEvent
  | UpdateTercioDataEvent
  | UpdateConclusionDataEvent
  | UpdateFinaleDataEvent
  // UI
  | ShowDraftConfirmationEvent
  | ShowDiscoveryBottomSheetEvent
  | ShowExitConfirmationEvent
  | ShowDecisionCardEvent
  // Completion
  | StartCompletingEvent
  | CompleteTastingSuccessEvent
  | CompleteTastingErrorEvent
  // Restoration
  | StartRestorationEvent
  | EndRestorationEvent
  | RestoreObservationsEvent;
