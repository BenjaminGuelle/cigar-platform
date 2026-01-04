import { Component, output, input, OnInit, signal, inject, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormControl } from '@angular/forms';
import { AutocompleteComponent, IconDirective, ButtonComponent, type AutocompleteOption, type IconName } from '@cigar-platform/shared/ui';
import { ContextStore, type ClubWithRole } from '../../../../core/stores/context.store';
import { injectSearchStore } from '../../../../core/stores/search.store';
import { SingleSelectChipsComponent, type SingleSelectOption } from '../shared/single-select-chips/single-select-chips.component';
import {
  TASTING_SITUATIONS,
  PAIRING_TYPES,
  type TastingMoment,
  type TastingSituation,
  type PairingType,
} from '@cigar-platform/shared/constants';

interface CigarBasic {
  id: string;
  name: string;
}

interface ClubBasic {
  id: string;
  name: string;
  imageUrl?: string | null;
}

type QuestionStep = 'cigar' | 'club' | 'situation' | 'pairing' | 'pairingNote' | 'location' | 'done';

interface PhaseQuickData {
  moment: TastingMoment;
  situation: TastingSituation | null;
  pairing: PairingType | null;
  pairingNote?: string;
  location?: string;
  cigar: string | null;
  cigarName: string | null;
  clubId: string | null;
  clubName: string | null;
}

/**
 * Phase Quick Chat Component
 * "L'Entrée en Matière" - Conversation progressive
 *
 * Chat-Like Architecture ⭐
 * - Une question à la fois
 * - Header récapitulatif qui se construit
 * - Auto-filled: date, heure, moment
 */
@Component({
  selector: 'app-phase-quick',
  standalone: true,
  imports: [CommonModule, FormsModule, AutocompleteComponent, SingleSelectChipsComponent, IconDirective, ButtonComponent],
  templateUrl: './phase-quick.component.html',
  styles: [`
    .question-step {
      animation: question-enter 0.25s ease-out;
    }
    @keyframes question-enter {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .header-summary {
      animation: header-update 0.3s ease-out;
    }
    @keyframes header-update {
      from { opacity: 0.7; }
      to { opacity: 1; }
    }
  `],
})
export class PhaseQuickComponent implements OnInit {
  readonly #contextStore = inject(ContextStore);
  readonly #searchStore = injectSearchStore();

  // Inputs
  initialCigar = input<CigarBasic | null | undefined>();
  initialSituation = input<TastingSituation | null | undefined>();
  initialPairing = input<PairingType | null | undefined>();
  initialPairingNote = input<string | null | undefined>();
  initialLocation = input<string | null | undefined>();

  // Outputs
  dataChange = output<PhaseQuickData>();
  done = output<void>();
  sceller = output<void>();
  explorer = output<void>();

  // Constants
  readonly situations = TASTING_SITUATIONS;
  readonly pairings = PAIRING_TYPES;

  // State
  currentStep = signal<QuestionStep>('cigar');
  selectedCigar = signal<CigarBasic | null>(null);
  selectedClub = signal<ClubBasic | null>(null);
  situationValue = signal<TastingSituation | null>(null);
  pairingValue = signal<PairingType | null>(null);
  pairingNoteValue = '';
  locationValue = '';
  cigarControl = new FormControl('');

  // Club options from ContextStore
  readonly clubOptions = computed<ClubBasic[]>(() => {
    return this.#contextStore.userClubs().map(club => ({
      id: club.id,
      name: club.name,
      imageUrl: club.imageUrl,
    }));
  });

  // Check if in club context (for pre-filling)
  readonly isClubContext = computed(() => this.#contextStore.context().type === 'club');
  readonly contextClub = computed(() => {
    const ctx = this.#contextStore.context();
    if (ctx.type === 'club' && ctx.club) {
      return { id: ctx.club.id, name: ctx.club.name, imageUrl: ctx.club.imageUrl };
    }
    return null;
  });

  readonly #now = new Date();

  // Options pour SingleSelectChips
  readonly situationOptions = computed<SingleSelectOption[]>(() =>
    this.situations.map(s => ({ id: s.id, label: s.label, emoji: this.getSituationEmoji(s.id) }))
  );

  readonly pairingOptions = computed<SingleSelectOption[]>(() =>
    this.pairings.map(p => ({ id: p.id, label: p.label, emoji: this.getPairingEmoji(p.id) }))
  );
  readonly #moment = computed<TastingMoment>(() => {
    const hour = this.#now.getHours();
    if (hour < 12) return 'MATIN';
    if (hour < 18) return 'APRES_MIDI';
    return 'SOIR';
  });

  // Cigar search
  readonly #cigarSearchQuery = signal<string>('');
  readonly #cigarSearchResults = this.#searchStore.search(() => this.#cigarSearchQuery());
  readonly cigarSearchLoading = this.#cigarSearchResults.loading;
  readonly cigarOptions = computed<AutocompleteOption[]>(() => {
    const results = this.#cigarSearchResults.data();
    const cigars = results?.cigars ?? [];
    return cigars.map(cigar => ({
      value: cigar.id,
      label: cigar.name,
      metadata: cigar.description || undefined,
      logoUrl: cigar.imageUrl || undefined,
      avatarText: cigar.name[0]?.toUpperCase() || 'C',
    }));
  });

  readonly headerSummary = computed(() => {
    const date = this.#now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    const time = this.#now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const parts = [date, time];

    if (this.situationValue()) {
      const sit = this.situations.find(s => s.id === this.situationValue());
      if (sit) parts.push(sit.label);
    } else {
      const momentLabels = { MATIN: 'Matin', APRES_MIDI: 'Après-midi', SOIR: 'Soir' };
      parts.push(momentLabels[this.#moment()]);
    }

    if (this.pairingValue()) {
      const pair = this.pairings.find(p => p.id === this.pairingValue());
      if (pair) parts.push(pair.label);
    }

    return parts.join(' • ');
  });

  readonly dateFormatted = computed(() => this.#now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }));
  readonly timeFormatted = computed(() => this.#now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
  readonly situationLabel = computed(() => this.situations.find(s => s.id === this.situationValue())?.label || '');
  readonly situationEmoji = computed(() => { const v = this.situationValue(); return v ? this.getSituationEmoji(v) : ''; });
  readonly situationIcon = computed<IconName>(() => { const v = this.situationValue(); return v ? this.getSituationIcon(v) : 'sun'; });
  readonly pairingLabel = computed(() => this.pairings.find(p => p.id === this.pairingValue())?.label || '');
  readonly pairingEmoji = computed(() => { const v = this.pairingValue(); return v ? this.getPairingEmoji(v) : ''; });
  readonly pairingIcon = computed<IconName>(() => { const v = this.pairingValue(); return v ? this.getPairingIcon(v) : 'coffee'; });

  #hasRestoredCigar = false;
  #hasRestoredData = false;

  constructor() {
    effect(() => {
      const initial = this.initialCigar();
      if (this.#hasRestoredCigar) return;
      if (initial) {
        this.#hasRestoredCigar = true;
        this.selectedCigar.set(initial);
      }
    });

    effect(() => {
      const situation = this.initialSituation();
      const pairing = this.initialPairing();
      const pairingNote = this.initialPairingNote();
      const location = this.initialLocation();
      const cigar = this.initialCigar();

      if (this.#hasRestoredData) return;

      const hasMeaningfulData = !!cigar || !!situation || !!pairing;
      if (!hasMeaningfulData) return;

      this.#hasRestoredData = true;

      if (situation) this.situationValue.set(situation);
      if (pairing) this.pairingValue.set(pairing);
      if (pairingNote) this.pairingNoteValue = pairingNote;
      if (location) this.locationValue = location;

      if (cigar && situation) {
        this.currentStep.set('done');
        this.done.emit();
      } else if (cigar) {
        // Go through club step first (user can select or skip)
        this.currentStep.set('club');
        this.#prefillClubFromContext();
      }
    });

    effect(() => {
      const cigar = this.selectedCigar();
      const situation = this.situationValue();
      const pairing = this.pairingValue();
      if (cigar || situation || pairing) this.emitData();
    });
  }

  ngOnInit(): void {
    if (!this.selectedCigar()) this.currentStep.set('cigar');
  }

  onCigarSearch(query: string): void { this.#cigarSearchQuery.set(query); }

  onCigarSelected(cigarId: string): void {
    const results = this.#cigarSearchResults.data();
    const cigar = results?.cigars?.find(c => c.id === cigarId);
    if (cigar) {
      this.selectedCigar.set(cigar);
      // Go to club step (user can select or skip)
      this.currentStep.set('club');
      // Pre-fill club from context if available
      this.#prefillClubFromContext();
    }
  }

  editCigar(): void { this.currentStep.set('cigar'); }

  // ==================== Club Selection ====================

  /**
   * Pre-fill club from context (Club context mode)
   */
  #prefillClubFromContext(): void {
    const ctxClub = this.contextClub();
    if (ctxClub && !this.selectedClub()) {
      this.selectedClub.set(ctxClub);
    }
  }

  /**
   * Select a club from the list
   */
  onClubSelected(clubId: string): void {
    const club = this.clubOptions().find(c => c.id === clubId);
    if (club) {
      this.selectedClub.set(club);
      this.emitData();
    }
  }

  /**
   * Clear selected club
   */
  clearClub(): void {
    this.selectedClub.set(null);
    this.emitData();
  }

  /**
   * Confirm club selection and proceed to situation
   */
  confirmClub(): void {
    this.currentStep.set('situation');
  }

  /**
   * Skip club selection and proceed to situation
   */
  skipClub(): void {
    this.selectedClub.set(null);
    this.currentStep.set('situation');
  }

  /**
   * Handler quand une situation est confirmée (après le ring)
   */
  onSituationConfirmed(situationId: string): void {
    this.situationValue.set(situationId as TastingSituation);
    this.currentStep.set('pairing');
  }

  getSituationEmoji(id: TastingSituation): string {
    const emojis: Record<TastingSituation, string> = { APERITIF: '🥂', COCKTAIL: '🍸', DIGESTIF: '🌙' };
    return emojis[id];
  }

  getSituationIcon(id: TastingSituation): IconName {
    const icons: Record<TastingSituation, IconName> = { APERITIF: 'sun', COCKTAIL: 'glass-water', DIGESTIF: 'moon' };
    return icons[id];
  }

  /**
   * Handler quand un pairing est confirmé (après le ring)
   */
  onPairingConfirmed(pairingId: string): void {
    this.pairingValue.set(pairingId as PairingType);
    this.currentStep.set('pairingNote');
  }

  skipPairing(): void {
    this.pairingValue.set(null);
    this.goToNextAfterPairing();
  }

  getPairingEmoji(id: PairingType): string {
    const emojis: Record<PairingType, string> = {
      CAFE: '☕', THE: '🍵', WHISKY: '🥃', RHUM: '🥃', COGNAC: '🥃', VIN: '🍷', BIERE: '🍺', EAU: '💧', AUTRE: '❓',
    };
    return emojis[id];
  }

  getPairingIcon(id: PairingType): IconName {
    const icons: Record<PairingType, IconName> = {
      CAFE: 'coffee', THE: 'cup-soda', WHISKY: 'wine', RHUM: 'wine', COGNAC: 'wine', VIN: 'wine', BIERE: 'beer', EAU: 'droplet', AUTRE: 'circle-help',
    };
    return icons[id];
  }

  submitPairingNote(): void { this.goToNextAfterPairing(); }
  skipPairingNote(): void { this.pairingNoteValue = ''; this.goToNextAfterPairing(); }

  submitLocation(): void { this.currentStep.set('done'); this.done.emit(); }
  skipLocation(): void { this.locationValue = ''; this.currentStep.set('done'); this.done.emit(); }

  goToNextAfterPairing(): void {
    const ctx = this.#contextStore.context();
    if (ctx.type === 'solo') {
      this.currentStep.set('location');
    } else {
      this.currentStep.set('done');
      this.done.emit();
    }
  }

  emitData(): void {
    this.dataChange.emit({
      moment: this.#moment(),
      situation: this.situationValue(),
      pairing: this.pairingValue(),
      pairingNote: this.pairingNoteValue || undefined,
      location: this.locationValue || undefined,
      cigar: this.selectedCigar()?.id || null,
      cigarName: this.selectedCigar()?.name || null,
      clubId: this.selectedClub()?.id || null,
      clubName: this.selectedClub()?.name || null,
    });
  }
}
