import { Component, output, input, OnInit, signal, inject, computed, effect, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { IconDirective, AutocompleteComponent } from '@cigar-platform/shared/ui';
import type { AutocompleteOption } from '@cigar-platform/shared/ui';
import { ContextStore } from '../../../../core/stores/context.store';
import { injectSearchStore } from '../../../../core/stores/search.store';
import { TastingFormService } from '../../services/tasting-form.service';
import type { CigarResponseDto } from '@cigar-platform/types';
import {
  TASTING_SITUATIONS,
  PAIRING_TYPES,
  type TastingMoment,
  type TastingSituation,
  type PairingType,
} from '@cigar-platform/shared/constants';
import type { Subscription } from 'rxjs';

/**
 * Pairing icon mapping (Lucide)
 * API-aligned keys (uppercase)
 */
const PAIRING_ICONS: Record<PairingType, string> = {
  CAFE: 'coffee',
  THE: 'cup-soda',
  WHISKY: 'wine',
  RHUM: 'wine',
  COGNAC: 'wine',
  VIN: 'wine',
  BIERE: 'beer',
  EAU: 'droplet',
  AUTRE: 'circle-help',
};

/**
 * Situation icon mapping (Lucide)
 * API-aligned keys (uppercase)
 */
const SITUATION_ICONS: Record<TastingSituation, string> = {
  APERITIF: 'sun',
  COCKTAIL: 'glass-water',
  DIGESTIF: 'moon',
};


/**
 * Phase Quick Component
 * "Le Rituel" - Compagnon intelligent de dégustation
 *
 * ALL STARS Architecture ⭐
 * - Minimaliste et intelligent
 * - Auto-calcul date/heure/moment
 * - Icônes Lucide uniquement
 * - Context-aware (Solo/Club)
 *
 * Captures:
 * - Situation (icônes)
 * - Pairing / Les Noces (icônes + précisions)
 */
@Component({
  selector: 'app-phase-quick',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IconDirective, AutocompleteComponent],
  template: `
    <div class="flex flex-col gap-10">
      <!-- Hero Section -->
      <div class="flex flex-col items-center gap-4 pb-6 border-b border-zinc-800">
        <!-- Date/Heure/Moment (auto-calculés, lecture seule) -->
        <div class="text-center text-sm text-smoke-400 italic">
          {{ formattedDateTime() }}
        </div>

        <!-- Contexte -->
        <div class="flex items-center gap-2 text-xs text-smoke-400 uppercase tracking-wider">
          <i [name]="contextIcon()" class="w-4 h-4"></i>
          <span>{{ contextLabel() }}</span>
        </div>

        <!-- Sélection Cigare -->
        <div class="w-full max-w-md">
          <ui-autocomplete
            [placeholder]="cigarPlaceholder()"
            [control]="quickForm.controls.cigar"
            [options]="cigarOptions()"
            [loading]="cigarSearchLoading()"
            [showCreateOption]="false"
            (search)="onCigarSearch($event)"
            (valueSelected)="onCigarSelected($event)"
          />
          @if (quickForm.controls.cigar.invalid && quickForm.controls.cigar.touched) {
            <p class="mt-2 text-xs text-red-500">
              Le choix du cigare est obligatoire
            </p>
          }
        </div>
      </div>

      <!-- Situation -->
      <div class="flex flex-col gap-4">
        <h3 class="text-center text-sm font-display text-gold-500 tracking-wide">L'Instant</h3>

        <div class="flex justify-center gap-3">
          @for (situation of situations; track situation.id) {
            <button
              type="button"
              (click)="selectSituation(situation.id)"
              [class]="quickForm.controls.situation.value === situation.id
                ? 'flex flex-col items-center gap-2 p-4 rounded-xl border border-gold-500 bg-gold-500/10 transition-all'
                : 'flex flex-col items-center gap-2 p-4 rounded-xl border border-zinc-800 hover:border-gold-500/30 transition-all'"
              [title]="situation.label"
            >
              <i
                [name]="getSituationIcon(situation.id)"
                [class]="quickForm.controls.situation.value === situation.id ? 'w-6 h-6 text-gold-500' : 'w-6 h-6 text-smoke-400'"
              ></i>
              <span
                [class]="quickForm.controls.situation.value === situation.id
                  ? 'text-xs text-gold-500 font-medium'
                  : 'text-xs text-smoke-400'"
              >
                {{ situation.label }}
              </span>
            </button>
          }
        </div>
      </div>

      <!-- Les Noces (Pairing) -->
      <div class="flex flex-col gap-4">
        <h3 class="text-center text-sm font-display text-gold-500 tracking-wide">Les Noces</h3>

        <div class="grid grid-cols-4 gap-3">
          @for (pairing of pairings; track pairing.id) {
            <button
              type="button"
              (click)="selectPairing(pairing.id)"
              [class]="quickForm.controls.pairing.value === pairing.id
                ? 'flex flex-col items-center gap-2 p-3 rounded-xl border border-gold-500 bg-gold-500/10 transition-all'
                : 'flex flex-col items-center gap-2 p-3 rounded-xl border border-zinc-800 hover:border-gold-500/30 transition-all'"
              [title]="pairing.label"
            >
              <i
                [name]="getPairingIcon(pairing.id)"
                [class]="quickForm.controls.pairing.value === pairing.id ? 'w-5 h-5 text-gold-500' : 'w-5 h-5 text-smoke-400'"
              ></i>
              <span
                [class]="quickForm.controls.pairing.value === pairing.id
                  ? 'text-[10px] text-gold-500 font-medium'
                  : 'text-[10px] text-smoke-400'"
              >
                {{ pairing.label }}
              </span>
            </button>
          }
        </div>

        <!-- Précisions (conditionnel) -->
        @if (quickForm.controls.pairing.value) {
          <input
            type="text"
            [formControl]="quickForm.controls.pairingNote"
            placeholder="Ex: Précisions sur l'accompagnement..."
            class="px-4 py-2 text-sm bg-transparent border border-zinc-800 rounded-lg text-smoke-200 placeholder:text-smoke-600 focus:outline-none focus:border-gold-500/50 transition-colors"
          />
        }
      </div>
    </div>
  `,
})
export class PhaseQuickComponent implements OnInit, OnDestroy {
  // Services
  readonly #contextStore = inject(ContextStore);
  readonly #searchStore = injectSearchStore();
  readonly #formService = inject(TastingFormService);

  // Inputs
  cigar = input<CigarResponseDto | undefined>();
  initialCigar = input<CigarResponseDto | null | undefined>(); // For draft restoration

  // Constants
  situations = TASTING_SITUATIONS;
  pairings = PAIRING_TYPES;
  pairingIcons = PAIRING_ICONS;
  situationIcons = SITUATION_ICONS;

  // Form (from TastingFormService)
  readonly quickForm = this.#formService.quickForm;

  // Cigar autocomplete search
  readonly #cigarSearchQuery = signal<string>('');
  readonly #debouncedCigarQuery = signal<string>('');
  readonly #selectedCigarId = signal<string | null>(null); // Track selected cigar UUID

  // Search query (reactive)
  readonly #cigarSearchResults = this.#searchStore.search(() => this.#debouncedCigarQuery());

  // Loading state
  readonly cigarSearchLoading = this.#cigarSearchResults.loading;

  // Map search results to autocomplete options
  readonly cigarOptions = computed<AutocompleteOption[]>(() => {
    const results = this.#cigarSearchResults.data();
    const cigars = results?.cigars ?? [];

    return cigars.map(cigar => ({
      value: cigar.id,
      label: cigar.name,
      metadata: cigar.description || undefined,
      logoUrl: cigar.imageUrl || undefined,
      avatarText: cigar.name[0]?.toUpperCase() || 'C', // Fallback initial
    }));
  });

  // Subscriptions
  #subscriptions: Subscription[] = [];

  // Internal state
  readonly #now = new Date();

  // Computed
  readonly #moment = computed<TastingMoment>(() => {
    const hour = this.#now.getHours();
    if (hour < 12) return 'MATIN';
    if (hour < 18) return 'APRES_MIDI';
    return 'SOIR';
  });

  formattedDateTime = computed(() => {
    const date = this.#now.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
    const time = this.#now.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const momentLabels = { MATIN: 'Matin', APRES_MIDI: 'Après-midi', SOIR: 'Soir' };
    return `${date} • ${time} • ${momentLabels[this.#moment()]}`;
  });

  contextLabel = computed(() => {
    const ctx = this.#contextStore.context();
    return ctx.type === 'solo' ? 'Solo' : ctx.club?.name || 'Club';
  });

  contextIcon = computed(() => {
    const ctx = this.#contextStore.context();
    return ctx.type === 'solo' ? 'user' : 'users';
  });

  cigarPlaceholder = computed(() => {
    const momentLabels = {
      MATIN: 'Le protagoniste de ce matin...',
      APRES_MIDI: 'Le protagoniste de cet après-midi...',
      SOIR: 'Le protagoniste de ce soir...',
    };
    return momentLabels[this.#moment()];
  });

  // Outputs
  dataChange = output<{
    date: string;
    moment: TastingMoment;
    cigar: string;
    situation: TastingSituation | null;
    pairing: PairingType | null;
    pairingNote: string;
    location: string;
  }>();

  constructor() {
    // Debounce cigar search (300ms like GlobalSearch)
    let debounceTimeout: ReturnType<typeof setTimeout> | null = null;

    effect(() => {
      const query = this.#cigarSearchQuery();

      // Clear previous timeout
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }

      // Set new timeout (300ms debounce)
      debounceTimeout = setTimeout(() => {
        this.#debouncedCigarQuery.set(query);
      }, 300);
    });

    // Watch for initialCigar changes (draft restoration)
    effect(() => {
      const initialCigar = this.initialCigar();
      if (initialCigar) {
        this.#selectedCigarId.set(initialCigar.id);
        // Set the FormControl to display the cigar name
        this.quickForm.controls.cigar.setValue(initialCigar.name, { emitEvent: false });
      }
    });

    // Listen to form changes and emit dataChange output
    const formSub = this.quickForm.valueChanges.subscribe(() => {
      this.#emitChange();
    });

    this.#subscriptions.push(formSub);
  }

  ngOnInit(): void {
    // Auto-emit initial state
    this.#emitChange();
  }

  selectSituation(situation: TastingSituation): void {
    this.quickForm.controls.situation.setValue(situation);
  }

  selectPairing(pairing: PairingType): void {
    this.quickForm.controls.pairing.setValue(pairing);
  }

  getPairingIcon(pairing: PairingType): any {
    return this.pairingIcons[pairing];
  }

  getSituationIcon(situation: TastingSituation): any {
    return this.situationIcons[situation];
  }

  onCigarSearch(query: string): void {
    this.#cigarSearchQuery.set(query);
  }

  onCigarSelected(cigarId: string): void {
    this.#selectedCigarId.set(cigarId);
    // Trigger data emission with the selected UUID
    this.#emitChange();
  }

  #emitChange(): void {
    const value = this.quickForm.getRawValue();
    // Use the selected cigar ID (UUID) instead of the FormControl value (label)
    const cigarId = this.#selectedCigarId();
    this.dataChange.emit({
      date: value.date,
      moment: value.moment,
      cigar: cigarId || '', // Emit UUID if selected, empty string otherwise
      situation: value.situation,
      pairing: value.pairing,
      pairingNote: value.pairingNote,
      location: '', // Not captured anymore
    });
  }

  ngOnDestroy(): void {
    this.#subscriptions.forEach(sub => sub.unsubscribe());
  }
}