import type {
  TastingSituation,
  PairingType,
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
import type { TastingResponseDto, CigarResponseDto } from '@cigar-platform/types';

/**
 * Flavor Tag (aromas/tastes)
 * Intensity levels: 1 = Faible (light), 2 = Moyen (medium), 3 = Fort (strong)
 */
export interface FlavorTag {
  id: string;
  intensity: 1 | 2 | 3;
}

/**
 * Phase Quick Data
 */
export interface QuickPhaseData {
  cigarId: string | null;
  cigarName: string | null;
  moment: string | null;
  situation: TastingSituation | null;
  pairing: PairingType | null;
  pairingNote: string;
  location: string;
  clubId: string | null;
  clubName: string | null;
}

/**
 * Phase Presentation Data
 */
export interface PresentationPhaseData {
  wrapperAspect: CapeAspect | null;
  wrapperColor: CapeColor | null;
  touch: CapeTouch | null;
}

/**
 * Phase Cold Draw Data
 */
export interface ColdDrawPhaseData {
  tastes: FlavorTag[];
  aromas: FlavorTag[];
  notes: string;
}

/**
 * Tercio Phase Data (first_third, second_third, final_third)
 */
export interface TercioPhaseData {
  tastes: FlavorTag[];
  aromas: FlavorTag[];
}

/**
 * Phase Conclusion Data
 */
export interface ConclusionPhaseData {
  draw: Draw | null;
  ashNature: AshNature | null;
  balance: Balance | null;
  terroir: Terroir | null;
  power: number;
  variety: number;
  mouthImpression: MouthImpression[];
  persistence: Persistence | null;
}

/**
 * Phase Finale Data
 */
export interface FinalePhaseData {
  rating: number;
  comment: string;
}

/**
 * Union type for any phase data (for getPhaseData return type)
 */
export type PhaseData =
  | QuickPhaseData
  | PresentationPhaseData
  | ColdDrawPhaseData
  | TercioPhaseData
  | ConclusionPhaseData
  | FinalePhaseData
  | null;

/**
 * Complete Tasting Data (all phases)
 */
export interface TastingData {
  quick: QuickPhaseData;
  presentation: PresentationPhaseData;
  coldDraw: ColdDrawPhaseData;
  firstThird: TercioPhaseData;
  secondThird: TercioPhaseData;
  finalThird: TercioPhaseData;
  conclusion: ConclusionPhaseData;
  finale: FinalePhaseData;
}

/**
 * Tasting Phase Union Type
 */
export type TastingPhase =
  | 'quick'
  | 'presentation'
  | 'cold_draw'
  | 'first_third'
  | 'second_third'
  | 'final_third'
  | 'conclusion'
  | 'finale'
  | 'confirmation';

/**
 * Flow Mode
 */
export type FlowMode = 'quick' | 'chronique' | null;

/**
 * UI State (modals, etc.)
 */
export interface TastingUIState {
  showDraftConfirmation: boolean;
  showDiscoveryBottomSheet: boolean;
  showExitConfirmation: boolean;
  showCompletionModal: boolean;
  showDecisionCard: boolean;
  isCompleting: boolean;
  isRestoringDraft: boolean;
}

/**
 * Complete Tasting State
 */
export interface TastingState {
  // Identity
  tastingId: string | null;
  cigarId: string | null;
  eventId: string | null;

  // Draft
  existingDraft: TastingResponseDto | null;
  confirmedDraftCigar: CigarResponseDto | null;

  // Navigation
  currentPhase: TastingPhase;
  highestVisitedPhase: TastingPhase;
  revealedPhases: Set<TastingPhase>;
  flowMode: FlowMode;
  isDiscoveryMode: boolean;

  // Data
  data: TastingData;

  // UI
  ui: TastingUIState;

  // Timing
  startTime: number;
}

/**
 * Create initial empty tasting data
 */
export function createInitialTastingData(): TastingData {
  return {
    quick: {
      cigarId: null,
      cigarName: null,
      moment: null,
      situation: null,
      pairing: null,
      pairingNote: '',
      location: 'Chez moi',
      clubId: null,
      clubName: null,
    },
    presentation: {
      wrapperAspect: null,
      wrapperColor: null,
      touch: null,
    },
    coldDraw: {
      tastes: [],
      aromas: [],
      notes: '',
    },
    firstThird: {
      tastes: [],
      aromas: [],
    },
    secondThird: {
      tastes: [],
      aromas: [],
    },
    finalThird: {
      tastes: [],
      aromas: [],
    },
    conclusion: {
      draw: null,
      ashNature: null,
      balance: null,
      terroir: null,
      power: 5,
      variety: 5,
      mouthImpression: [],
      persistence: null,
    },
    finale: {
      rating: 0,
      comment: '',
    },
  };
}

/**
 * Create initial tasting state
 */
export function createInitialTastingState(): TastingState {
  return {
    tastingId: null,
    cigarId: null,
    eventId: null,
    existingDraft: null,
    confirmedDraftCigar: null,
    currentPhase: 'quick',
    highestVisitedPhase: 'quick',
    revealedPhases: new Set(['quick', 'finale']),
    flowMode: null,
    isDiscoveryMode: false,
    data: createInitialTastingData(),
    ui: {
      showDraftConfirmation: false,
      showDiscoveryBottomSheet: false,
      showExitConfirmation: false,
      showCompletionModal: false,
      showDecisionCard: false,
      isCompleting: false,
      isRestoringDraft: false,
    },
    startTime: Date.now(),
  };
}

/**
 * Phase order for navigation
 */
export const PHASE_ORDER: TastingPhase[] = [
  'quick',
  'presentation',
  'cold_draw',
  'first_third',
  'second_third',
  'final_third',
  'conclusion',
  'finale',
];

/**
 * Chronique phases (observation phases)
 */
export const CHRONIQUE_PHASES: TastingPhase[] = [
  'presentation',
  'cold_draw',
  'first_third',
  'second_third',
  'final_third',
  'conclusion',
];

/**
 * Get phase index in order
 */
export function getPhaseIndex(phase: TastingPhase): number {
  return PHASE_ORDER.indexOf(phase);
}

/**
 * Get next phase in order
 */
export function getNextPhase(phase: TastingPhase): TastingPhase | null {
  const index = getPhaseIndex(phase);
  if (index < 0 || index >= PHASE_ORDER.length - 1) return null;
  return PHASE_ORDER[index + 1];
}

/**
 * Is phase accessible based on highest visited?
 */
export function isPhaseAccessible(phase: TastingPhase, highestVisited: TastingPhase): boolean {
  const targetIndex = getPhaseIndex(phase);
  const highestIndex = getPhaseIndex(highestVisited);
  return targetIndex <= highestIndex + 1;
}
