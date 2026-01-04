import { TestBed } from '@angular/core/testing';
import { TastingStateMachine } from './tasting-state-machine.service';
import { createInitialTastingState, CHRONIQUE_PHASES } from '../models/tasting-state.model';
import type { TastingResponseDto, CigarResponseDto } from '@cigar-platform/types';

describe('TastingStateMachine', () => {
  let machine: TastingStateMachine;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TastingStateMachine],
    });
    machine = TestBed.inject(TastingStateMachine);
  });

  // ==================== Initial State ====================

  describe('Initial State', () => {
    it('should start with initial state', () => {
      expect(machine.currentPhase()).toBe('quick');
      expect(machine.highestVisitedPhase()).toBe('quick');
      expect(machine.flowMode()).toBeNull();
      expect(machine.isDiscoveryMode()).toBe(false);
      expect(machine.tastingId()).toBeNull();
      expect(machine.cigarId()).toBeNull();
      expect(machine.eventId()).toBeNull();
    });

    it('should have quick and finale phases revealed by default', () => {
      expect(machine.isPhaseRevealed('quick')).toBe(true);
      expect(machine.isPhaseRevealed('finale')).toBe(true);
      expect(machine.isPhaseRevealed('presentation')).toBe(false);
      expect(machine.isPhaseRevealed('cold_draw')).toBe(false);
    });

    it('should have all UI flags set to false initially', () => {
      expect(machine.showDraftConfirmation()).toBe(false);
      expect(machine.showDiscoveryBottomSheet()).toBe(false);
      expect(machine.showExitConfirmation()).toBe(false);
      expect(machine.showCompletionModal()).toBe(false);
      expect(machine.showDecisionCard()).toBe(false);
      expect(machine.isCompleting()).toBe(false);
      expect(machine.isRestoringDraft()).toBe(false);
    });

    it('should have initial data with default values', () => {
      const quickData = machine.quickData();
      expect(quickData.cigarId).toBeNull();
      expect(quickData.situation).toBeNull();
      expect(quickData.location).toBe('Chez moi');

      const finaleData = machine.finaleData();
      expect(finaleData.rating).toBe(0);
      expect(finaleData.comment).toBe('');
    });

    it('should not be able to complete initially (no rating)', () => {
      expect(machine.canComplete()).toBe(false);
    });
  });

  // ==================== Draft Events ====================

  describe('Draft Events', () => {
    const mockCigar: CigarResponseDto = {
      id: 'cigar-456',
      name: 'Test Cigar',
      slug: 'test-cigar',
      vitola: 'robusto',
      strength: 3,
      brand: {
        id: 'brand-123',
        name: 'Test Brand',
        slug: 'test-brand',
        country: null,
        description: null,
        logoUrl: null,
        isVerified: true,
        createdAt: new Date().toISOString(),
      },
      isVerified: true,
      status: 'approved',
      createdAt: new Date().toISOString(),
    };

    const mockDraft: TastingResponseDto = {
      id: 'draft-123',
      cigarId: 'cigar-456',
      userId: 'user-789',
      status: 'DRAFT',
      rating: 4,
      comment: 'Test comment',
      moment: 'MATIN',
      situation: 'APERITIF',
      location: 'Test location',
      pairing: 'CAFE',
      pairingNote: 'Test pairing',
      date: new Date().toISOString(),
      visibility: 'PUBLIC',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      cigar: mockCigar,
    };

    describe('DRAFT_FOUND', () => {
      it('should store draft and show confirmation modal', () => {
        machine.dispatch({ type: 'DRAFT_FOUND', draft: mockDraft });

        expect(machine.existingDraft()).toBe(mockDraft);
        expect(machine.showDraftConfirmation()).toBe(true);
      });
    });

    describe('CONTINUE_DRAFT', () => {
      it('should restore draft data when continuing', () => {
        machine.dispatch({ type: 'DRAFT_FOUND', draft: mockDraft });
        machine.dispatch({ type: 'CONTINUE_DRAFT' });

        expect(machine.tastingId()).toBe('draft-123');
        expect(machine.cigarId()).toBe('cigar-456');
        expect(machine.quickData().cigarId).toBe('cigar-456');
        expect(machine.quickData().situation).toBe('APERITIF');
        expect(machine.quickData().pairing).toBe('CAFE');
        expect(machine.finaleData().rating).toBe(4);
        expect(machine.finaleData().comment).toBe('Test comment');
        expect(machine.showDraftConfirmation()).toBe(false);
        expect(machine.isRestoringDraft()).toBe(true);
      });

      it('should not change state if no draft exists', () => {
        const stateBefore = machine.state();
        machine.dispatch({ type: 'CONTINUE_DRAFT' });
        expect(machine.state()).toEqual(stateBefore);
      });
    });

    describe('START_NEW', () => {
      it('should reset to initial state', () => {
        machine.dispatch({ type: 'DRAFT_FOUND', draft: mockDraft });
        machine.dispatch({ type: 'START_NEW' });

        expect(machine.tastingId()).toBeNull();
        expect(machine.existingDraft()).toBeNull();
        expect(machine.currentPhase()).toBe('quick');
      });

      it('should preserve cigarId and eventId if provided', () => {
        machine.dispatch({
          type: 'START_NEW',
          cigarId: 'new-cigar',
          eventId: 'new-event',
        });

        expect(machine.cigarId()).toBe('new-cigar');
        expect(machine.eventId()).toBe('new-event');
      });
    });

    describe('TASTING_CREATED', () => {
      it('should set tasting ID and cigar', () => {
        const cigar = { id: 'cigar-456', name: 'Test Cigar' } as CigarResponseDto;
        machine.dispatch({
          type: 'TASTING_CREATED',
          tastingId: 'tasting-123',
          cigar,
        });

        expect(machine.tastingId()).toBe('tasting-123');
        expect(machine.confirmedDraftCigar()).toBe(cigar);
      });
    });
  });

  // ==================== Navigation Events ====================

  describe('Navigation Events', () => {
    describe('NAVIGATE_TO_PHASE', () => {
      it('should navigate to accessible phase', () => {
        machine.dispatch({ type: 'START_CHRONIQUE', isDiscovery: false });
        machine.dispatch({ type: 'NAVIGATE_TO_PHASE', phase: 'presentation' });

        expect(machine.currentPhase()).toBe('presentation');
      });

      it('should not navigate to inaccessible phase', () => {
        machine.dispatch({ type: 'NAVIGATE_TO_PHASE', phase: 'conclusion' });

        expect(machine.currentPhase()).toBe('quick');
      });

      it('should update highestVisitedPhase if navigating forward', () => {
        machine.dispatch({ type: 'START_CHRONIQUE', isDiscovery: false });

        expect(machine.highestVisitedPhase()).toBe('presentation');

        machine.dispatch({ type: 'PHASE_COMPLETED', phase: 'presentation' });
        expect(machine.highestVisitedPhase()).toBe('cold_draw');
      });

      it('should not update highestVisitedPhase when navigating backward', () => {
        machine.dispatch({ type: 'START_CHRONIQUE', isDiscovery: false });
        machine.dispatch({ type: 'PHASE_COMPLETED', phase: 'presentation' });

        const highest = machine.highestVisitedPhase();
        machine.dispatch({ type: 'NAVIGATE_TO_PHASE', phase: 'presentation' });

        expect(machine.highestVisitedPhase()).toBe(highest);
      });

      it('should not create new state if already on that phase', () => {
        const stateBefore = machine.state();
        machine.dispatch({ type: 'NAVIGATE_TO_PHASE', phase: 'quick' });
        expect(machine.state()).toBe(stateBefore);
      });
    });

    describe('START_CHRONIQUE', () => {
      it('should set flowMode to chronique', () => {
        machine.dispatch({ type: 'START_CHRONIQUE', isDiscovery: false });

        expect(machine.flowMode()).toBe('chronique');
      });

      it('should navigate to presentation phase', () => {
        machine.dispatch({ type: 'START_CHRONIQUE', isDiscovery: false });

        expect(machine.currentPhase()).toBe('presentation');
        expect(machine.highestVisitedPhase()).toBe('presentation');
      });

      it('should reveal all chronique phases', () => {
        machine.dispatch({ type: 'START_CHRONIQUE', isDiscovery: false });

        CHRONIQUE_PHASES.forEach((phase) => {
          expect(machine.isPhaseRevealed(phase)).toBe(true);
        });
      });

      it('should set discovery mode flag', () => {
        machine.dispatch({ type: 'START_CHRONIQUE', isDiscovery: true });

        expect(machine.isDiscoveryMode()).toBe(true);
      });

      it('should hide decision card and discovery bottom sheet', () => {
        machine.dispatch({ type: 'SHOW_DECISION_CARD', show: true });
        machine.dispatch({ type: 'SHOW_DISCOVERY_BOTTOM_SHEET', show: true });
        machine.dispatch({ type: 'START_CHRONIQUE', isDiscovery: false });

        expect(machine.showDecisionCard()).toBe(false);
        expect(machine.showDiscoveryBottomSheet()).toBe(false);
      });
    });

    describe('GO_TO_VERDICT', () => {
      it('should navigate to finale phase', () => {
        machine.dispatch({ type: 'GO_TO_VERDICT' });

        expect(machine.currentPhase()).toBe('finale');
        expect(machine.highestVisitedPhase()).toBe('finale');
      });

      it('should set flowMode to quick', () => {
        machine.dispatch({ type: 'GO_TO_VERDICT' });

        expect(machine.flowMode()).toBe('quick');
      });

      it('should hide decision card', () => {
        machine.dispatch({ type: 'SHOW_DECISION_CARD', show: true });
        machine.dispatch({ type: 'GO_TO_VERDICT' });

        expect(machine.showDecisionCard()).toBe(false);
      });
    });
  });

  // ==================== Phase Completion Events ====================

  describe('Phase Completion Events', () => {
    describe('QUICK_PHASE_COMPLETED', () => {
      it('should unlock finale and show decision card', () => {
        machine.dispatch({ type: 'QUICK_PHASE_COMPLETED' });

        expect(machine.highestVisitedPhase()).toBe('finale');
        expect(machine.showDecisionCard()).toBe(true);
      });
    });

    describe('PHASE_COMPLETED', () => {
      it('should advance to next phase', () => {
        machine.dispatch({ type: 'START_CHRONIQUE', isDiscovery: false });
        machine.dispatch({ type: 'PHASE_COMPLETED', phase: 'presentation' });

        expect(machine.currentPhase()).toBe('cold_draw');
        expect(machine.highestVisitedPhase()).toBe('cold_draw');
      });

      it('should advance through all chronique phases', () => {
        machine.dispatch({ type: 'START_CHRONIQUE', isDiscovery: false });

        machine.dispatch({ type: 'PHASE_COMPLETED', phase: 'presentation' });
        expect(machine.currentPhase()).toBe('cold_draw');

        machine.dispatch({ type: 'PHASE_COMPLETED', phase: 'cold_draw' });
        expect(machine.currentPhase()).toBe('first_third');

        machine.dispatch({ type: 'PHASE_COMPLETED', phase: 'first_third' });
        expect(machine.currentPhase()).toBe('second_third');

        machine.dispatch({ type: 'PHASE_COMPLETED', phase: 'second_third' });
        expect(machine.currentPhase()).toBe('final_third');

        machine.dispatch({ type: 'PHASE_COMPLETED', phase: 'final_third' });
        expect(machine.currentPhase()).toBe('conclusion');

        machine.dispatch({ type: 'PHASE_COMPLETED', phase: 'conclusion' });
        expect(machine.currentPhase()).toBe('finale');
      });

      it('should not change state if no next phase', () => {
        machine.dispatch({ type: 'GO_TO_VERDICT' });
        const stateBefore = machine.state();

        machine.dispatch({ type: 'PHASE_COMPLETED', phase: 'finale' });

        // Only UI might change, but currentPhase should stay
        expect(machine.currentPhase()).toBe('finale');
      });
    });
  });

  // ==================== Data Update Events ====================

  describe('Data Update Events', () => {
    describe('UPDATE_QUICK_DATA', () => {
      it('should update quick phase data', () => {
        machine.dispatch({
          type: 'UPDATE_QUICK_DATA',
          data: { cigarId: 'test-cigar', situation: 'APERITIF' },
        });

        expect(machine.quickData().cigarId).toBe('test-cigar');
        expect(machine.quickData().situation).toBe('APERITIF');
      });

      it('should merge with existing data', () => {
        machine.dispatch({
          type: 'UPDATE_QUICK_DATA',
          data: { cigarId: 'test-cigar' },
        });
        machine.dispatch({
          type: 'UPDATE_QUICK_DATA',
          data: { situation: 'DIGESTIF' },
        });

        expect(machine.quickData().cigarId).toBe('test-cigar');
        expect(machine.quickData().situation).toBe('DIGESTIF');
      });
    });

    describe('UPDATE_PRESENTATION_DATA', () => {
      it('should update presentation phase data', () => {
        machine.dispatch({
          type: 'UPDATE_PRESENTATION_DATA',
          data: { wrapperColor: 'colorado', touch: 'firm' },
        });

        expect(machine.presentationData().wrapperColor).toBe('colorado');
        expect(machine.presentationData().touch).toBe('firm');
      });
    });

    describe('UPDATE_COLD_DRAW_DATA', () => {
      it('should update cold draw phase data', () => {
        const tastes = [{ id: 'wood', intensity: 2 as const }];
        machine.dispatch({
          type: 'UPDATE_COLD_DRAW_DATA',
          data: { tastes, notes: 'Test notes' },
        });

        expect(machine.coldDrawData().tastes).toEqual(tastes);
        expect(machine.coldDrawData().notes).toBe('Test notes');
      });
    });

    describe('UPDATE_TERCIO_DATA', () => {
      it('should update firstThird data', () => {
        const aromas = [{ id: 'leather', intensity: 3 as const }];
        machine.dispatch({
          type: 'UPDATE_TERCIO_DATA',
          tercio: 'firstThird',
          data: { aromas },
        });

        expect(machine.firstThirdData().aromas).toEqual(aromas);
      });

      it('should update secondThird data', () => {
        const tastes = [{ id: 'cocoa', intensity: 1 as const }];
        machine.dispatch({
          type: 'UPDATE_TERCIO_DATA',
          tercio: 'secondThird',
          data: { tastes },
        });

        expect(machine.secondThirdData().tastes).toEqual(tastes);
      });

      it('should update finalThird data', () => {
        const tastes = [{ id: 'pepper', intensity: 3 as const }];
        machine.dispatch({
          type: 'UPDATE_TERCIO_DATA',
          tercio: 'finalThird',
          data: { tastes },
        });

        expect(machine.finalThirdData().tastes).toEqual(tastes);
      });
    });

    describe('UPDATE_CONCLUSION_DATA', () => {
      it('should update conclusion phase data', () => {
        machine.dispatch({
          type: 'UPDATE_CONCLUSION_DATA',
          data: { draw: 'correct', balance: 'good', power: 7 },
        });

        expect(machine.conclusionData().draw).toBe('correct');
        expect(machine.conclusionData().balance).toBe('good');
        expect(machine.conclusionData().power).toBe(7);
      });
    });

    describe('UPDATE_FINALE_DATA', () => {
      it('should update finale phase data', () => {
        machine.dispatch({
          type: 'UPDATE_FINALE_DATA',
          data: { rating: 85, comment: 'Excellent cigar' },
        });

        expect(machine.finaleData().rating).toBe(85);
        expect(machine.finaleData().comment).toBe('Excellent cigar');
      });

      it('should allow completion when rating is set', () => {
        expect(machine.canComplete()).toBe(false);

        machine.dispatch({
          type: 'UPDATE_FINALE_DATA',
          data: { rating: 75 },
        });

        expect(machine.canComplete()).toBe(true);
      });
    });
  });

  // ==================== UI Events ====================

  describe('UI Events', () => {
    describe('SHOW_DRAFT_CONFIRMATION', () => {
      it('should toggle draft confirmation modal', () => {
        machine.dispatch({ type: 'SHOW_DRAFT_CONFIRMATION', show: true });
        expect(machine.showDraftConfirmation()).toBe(true);

        machine.dispatch({ type: 'SHOW_DRAFT_CONFIRMATION', show: false });
        expect(machine.showDraftConfirmation()).toBe(false);
      });
    });

    describe('SHOW_DISCOVERY_BOTTOM_SHEET', () => {
      it('should toggle discovery bottom sheet', () => {
        machine.dispatch({ type: 'SHOW_DISCOVERY_BOTTOM_SHEET', show: true });
        expect(machine.showDiscoveryBottomSheet()).toBe(true);

        machine.dispatch({ type: 'SHOW_DISCOVERY_BOTTOM_SHEET', show: false });
        expect(machine.showDiscoveryBottomSheet()).toBe(false);
      });
    });

    describe('SHOW_EXIT_CONFIRMATION', () => {
      it('should toggle exit confirmation modal', () => {
        machine.dispatch({ type: 'SHOW_EXIT_CONFIRMATION', show: true });
        expect(machine.showExitConfirmation()).toBe(true);

        machine.dispatch({ type: 'SHOW_EXIT_CONFIRMATION', show: false });
        expect(machine.showExitConfirmation()).toBe(false);
      });
    });

    describe('SHOW_DECISION_CARD', () => {
      it('should toggle decision card visibility', () => {
        machine.dispatch({ type: 'SHOW_DECISION_CARD', show: true });
        expect(machine.showDecisionCard()).toBe(true);

        machine.dispatch({ type: 'SHOW_DECISION_CARD', show: false });
        expect(machine.showDecisionCard()).toBe(false);
      });
    });
  });

  // ==================== Completion Events ====================

  describe('Completion Events', () => {
    describe('START_COMPLETING', () => {
      it('should set isCompleting flag', () => {
        machine.dispatch({ type: 'START_COMPLETING' });
        expect(machine.isCompleting()).toBe(true);
      });
    });

    describe('COMPLETE_TASTING_SUCCESS', () => {
      it('should reset completing state and show completion modal', () => {
        machine.dispatch({ type: 'START_COMPLETING' });
        machine.dispatch({ type: 'COMPLETE_TASTING_SUCCESS' });

        expect(machine.isCompleting()).toBe(false);
        expect(machine.showCompletionModal()).toBe(true);
      });

      it('should clear draft data', () => {
        const mockDraft = {
          id: 'draft-123',
          cigarId: 'cigar-456',
        } as TastingResponseDto;

        machine.dispatch({ type: 'DRAFT_FOUND', draft: mockDraft });
        machine.dispatch({ type: 'CONTINUE_DRAFT' });
        machine.dispatch({ type: 'COMPLETE_TASTING_SUCCESS' });

        expect(machine.existingDraft()).toBeNull();
        expect(machine.confirmedDraftCigar()).toBeNull();
      });
    });

    describe('COMPLETE_TASTING_ERROR', () => {
      it('should reset completing flag', () => {
        machine.dispatch({ type: 'START_COMPLETING' });
        machine.dispatch({ type: 'COMPLETE_TASTING_ERROR' });

        expect(machine.isCompleting()).toBe(false);
        expect(machine.showCompletionModal()).toBe(false);
      });
    });
  });

  // ==================== Restoration Events ====================

  describe('Restoration Events', () => {
    describe('START_RESTORATION', () => {
      it('should set isRestoringDraft flag', () => {
        machine.dispatch({ type: 'START_RESTORATION' });
        expect(machine.isRestoringDraft()).toBe(true);
      });
    });

    describe('END_RESTORATION', () => {
      it('should clear isRestoringDraft flag', () => {
        machine.dispatch({ type: 'START_RESTORATION' });
        machine.dispatch({ type: 'END_RESTORATION' });
        expect(machine.isRestoringDraft()).toBe(false);
      });
    });

    describe('RESTORE_OBSERVATIONS', () => {
      it('should restore presentation data', () => {
        const observations = [
          {
            phase: 'presentation',
            organoleptic: {
              presentation: {
                wrapperColor: 'maduro',
                wrapperAspect: 'oily',
                touch: 'silk',
              },
            },
          },
        ];

        machine.dispatch({ type: 'RESTORE_OBSERVATIONS', observations });

        expect(machine.presentationData().wrapperColor).toBe('maduro');
        expect(machine.presentationData().wrapperAspect).toBe('oily');
        expect(machine.presentationData().touch).toBe('silk');
      });

      it('should restore cold_draw data', () => {
        const observations = [
          {
            phase: 'cold_draw',
            organoleptic: {
              coldDraw: {
                tastes: [{ id: 'wood', intensity: 2 }],
                aromas: [{ id: 'leather', intensity: 1 }],
                notes: 'Test notes',
              },
            },
          },
        ];

        machine.dispatch({ type: 'RESTORE_OBSERVATIONS', observations });

        expect(machine.coldDrawData().tastes).toEqual([{ id: 'wood', intensity: 2 }]);
        expect(machine.coldDrawData().aromas).toEqual([{ id: 'leather', intensity: 1 }]);
        expect(machine.coldDrawData().notes).toBe('Test notes');
      });

      it('should restore tercio data', () => {
        const observations = [
          {
            phase: 'first_third',
            organoleptic: {
              firstThird: {
                tastes: [{ id: 'cocoa', intensity: 2 }],
                aromas: [{ id: 'earth', intensity: 3 }],
              },
            },
          },
          {
            phase: 'second_third',
            organoleptic: {
              secondThird: {
                tastes: [{ id: 'pepper', intensity: 1 }],
                aromas: [],
              },
            },
          },
        ];

        machine.dispatch({ type: 'RESTORE_OBSERVATIONS', observations });

        expect(machine.firstThirdData().tastes).toEqual([{ id: 'cocoa', intensity: 2 }]);
        expect(machine.firstThirdData().aromas).toEqual([{ id: 'earth', intensity: 3 }]);
        expect(machine.secondThirdData().tastes).toEqual([{ id: 'pepper', intensity: 1 }]);
      });

      it('should restore conclusion data', () => {
        const observations = [
          {
            phase: 'conclusion',
            organoleptic: {
              conclusion: {
                draw: 'ideal',
                ashNature: 'compact',
                balance: 'perfect',
                terroir: 'caribbean',
                power: 8,
                variety: 7,
                mouthImpression: ['smooth'],
                persistence: 'long',
              },
            },
          },
        ];

        machine.dispatch({ type: 'RESTORE_OBSERVATIONS', observations });

        expect(machine.conclusionData().draw).toBe('ideal');
        expect(machine.conclusionData().balance).toBe('perfect');
        expect(machine.conclusionData().power).toBe(8);
      });

      it('should set navigation state based on restored phases', () => {
        const observations = [
          { phase: 'presentation', organoleptic: { presentation: {} } },
          { phase: 'cold_draw', organoleptic: { coldDraw: {} } },
          { phase: 'first_third', organoleptic: { firstThird: {} } },
        ];

        machine.dispatch({ type: 'RESTORE_OBSERVATIONS', observations });

        // Should be on second_third (next after first_third)
        expect(machine.currentPhase()).toBe('second_third');
        expect(machine.flowMode()).toBe('chronique');
        expect(machine.isRestoringDraft()).toBe(false);
      });

      it('should navigate to finale if all chronique phases are restored', () => {
        const observations = CHRONIQUE_PHASES.map((phase) => ({
          phase,
          organoleptic: { [phase === 'cold_draw' ? 'coldDraw' : phase]: {} },
        }));

        machine.dispatch({ type: 'RESTORE_OBSERVATIONS', observations });

        expect(machine.currentPhase()).toBe('finale');
      });

      it('should unlock finale if no chronique phases restored', () => {
        machine.dispatch({ type: 'RESTORE_OBSERVATIONS', observations: [] });

        expect(machine.highestVisitedPhase()).toBe('finale');
      });
    });
  });

  // ==================== Helper Methods ====================

  describe('Helper Methods', () => {
    describe('isPhaseRevealed', () => {
      it('should return true for revealed phases', () => {
        expect(machine.isPhaseRevealed('quick')).toBe(true);
        expect(machine.isPhaseRevealed('finale')).toBe(true);
      });

      it('should return false for unrevealed phases', () => {
        expect(machine.isPhaseRevealed('presentation')).toBe(false);
        expect(machine.isPhaseRevealed('cold_draw')).toBe(false);
      });

      it('should return true for all phases after START_CHRONIQUE', () => {
        machine.dispatch({ type: 'START_CHRONIQUE', isDiscovery: false });

        CHRONIQUE_PHASES.forEach((phase) => {
          expect(machine.isPhaseRevealed(phase)).toBe(true);
        });
      });
    });

    describe('isPhaseAccessible', () => {
      it('should return true for current and previous phases', () => {
        expect(machine.isPhaseAccessible('quick')).toBe(true);
      });

      it('should return false for phases beyond highest visited + 1', () => {
        expect(machine.isPhaseAccessible('conclusion')).toBe(false);
        expect(machine.isPhaseAccessible('finale')).toBe(false);
      });

      it('should return true for next phase after highest visited', () => {
        machine.dispatch({ type: 'START_CHRONIQUE', isDiscovery: false });
        machine.dispatch({ type: 'PHASE_COMPLETED', phase: 'presentation' });

        expect(machine.isPhaseAccessible('cold_draw')).toBe(true);
        expect(machine.isPhaseAccessible('first_third')).toBe(true);
      });
    });

    describe('getPhaseState', () => {
      it('should return "active" for current phase', () => {
        expect(machine.getPhaseState('quick')).toBe('active');
      });

      it('should return "locked" for inaccessible phases', () => {
        expect(machine.getPhaseState('conclusion')).toBe('locked');
      });

      it('should return "completed" for phases before current', () => {
        machine.dispatch({ type: 'START_CHRONIQUE', isDiscovery: false });
        machine.dispatch({ type: 'PHASE_COMPLETED', phase: 'presentation' });

        expect(machine.getPhaseState('presentation')).toBe('completed');
        expect(machine.getPhaseState('cold_draw')).toBe('active');
      });

      it('should return "accessible" for accessible but not current phases', () => {
        machine.dispatch({ type: 'START_CHRONIQUE', isDiscovery: false });
        machine.dispatch({ type: 'PHASE_COMPLETED', phase: 'presentation' });
        machine.dispatch({ type: 'PHASE_COMPLETED', phase: 'cold_draw' });

        // Navigate back to presentation
        machine.dispatch({ type: 'NAVIGATE_TO_PHASE', phase: 'presentation' });

        expect(machine.getPhaseState('cold_draw')).toBe('accessible');
        expect(machine.getPhaseState('first_third')).toBe('accessible');
      });
    });

    describe('getPhaseIndex', () => {
      it('should return correct index for each phase', () => {
        expect(machine.getPhaseIndex('quick')).toBe(0);
        expect(machine.getPhaseIndex('presentation')).toBe(1);
        expect(machine.getPhaseIndex('cold_draw')).toBe(2);
        expect(machine.getPhaseIndex('first_third')).toBe(3);
        expect(machine.getPhaseIndex('second_third')).toBe(4);
        expect(machine.getPhaseIndex('final_third')).toBe(5);
        expect(machine.getPhaseIndex('conclusion')).toBe(6);
        expect(machine.getPhaseIndex('finale')).toBe(7);
      });
    });

    describe('reset', () => {
      it('should reset to initial state', () => {
        // Modify state
        machine.dispatch({ type: 'START_CHRONIQUE', isDiscovery: true });
        machine.dispatch({
          type: 'UPDATE_QUICK_DATA',
          data: { cigarId: 'test' },
        });
        machine.dispatch({
          type: 'UPDATE_FINALE_DATA',
          data: { rating: 85 },
        });

        // Reset
        machine.reset();

        // Verify reset
        expect(machine.currentPhase()).toBe('quick');
        expect(machine.flowMode()).toBeNull();
        expect(machine.isDiscoveryMode()).toBe(false);
        expect(machine.quickData().cigarId).toBeNull();
        expect(machine.finaleData().rating).toBe(0);
      });
    });

    describe('setTastingId', () => {
      it('should set tasting ID', () => {
        machine.setTastingId('tasting-123');
        expect(machine.tastingId()).toBe('tasting-123');
      });
    });

    describe('setEventId', () => {
      it('should set event ID', () => {
        machine.setEventId('event-456');
        expect(machine.eventId()).toBe('event-456');
      });

      it('should allow setting null', () => {
        machine.setEventId('event-456');
        machine.setEventId(null);
        expect(machine.eventId()).toBeNull();
      });
    });
  });

  // ==================== Computed Signals ====================

  describe('Computed Signals', () => {
    describe('currentPhaseLabel', () => {
      it('should return correct label for each phase', () => {
        expect(machine.currentPhaseLabel()).toBe("L'Entrée en Matière");

        machine.dispatch({ type: 'START_CHRONIQUE', isDiscovery: false });
        expect(machine.currentPhaseLabel()).toBe('Présentation');

        machine.dispatch({ type: 'PHASE_COMPLETED', phase: 'presentation' });
        expect(machine.currentPhaseLabel()).toBe('Fumage à cru');
      });
    });

    describe('completedPhases', () => {
      it('should return empty array initially', () => {
        expect(machine.completedPhases()).toEqual([]);
      });

      it('should return completed phases', () => {
        machine.dispatch({ type: 'START_CHRONIQUE', isDiscovery: false });
        expect(machine.completedPhases()).toEqual(['quick']);

        machine.dispatch({ type: 'PHASE_COMPLETED', phase: 'presentation' });
        expect(machine.completedPhases()).toEqual(['quick', 'presentation']);
      });
    });

    describe('isPhase1Completed', () => {
      it('should return false when quick data is incomplete', () => {
        expect(machine.isPhase1Completed()).toBe(false);
      });

      it('should return true when cigarId and situation are set', () => {
        machine.dispatch({
          type: 'UPDATE_QUICK_DATA',
          data: { cigarId: 'test-cigar', situation: 'COCKTAIL' },
        });

        expect(machine.isPhase1Completed()).toBe(true);
      });
    });
  });
});
