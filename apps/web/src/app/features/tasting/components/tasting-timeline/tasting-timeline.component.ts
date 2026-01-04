import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { TastingPhase } from '../../services/tasting-orchestrator.service';

/**
 * Phase labels for timeline
 */
const PHASE_LABELS: Record<TastingPhase, { short: string; full: string }> = {
  quick: { short: 'Le Rituel', full: 'L\'Entrée en Matière' },
  presentation: { short: 'La Cape', full: 'Présentation' },
  cold_draw: { short: 'À Cru', full: 'Fumage à Cru' },
  first_third: { short: 'L\'Éveil', full: 'Premier Tiers' },
  second_third: { short: 'La Plénitude', full: 'Deuxième Tiers' },
  final_third: { short: 'L\'Intensité', full: 'Dernier Tiers' },
  conclusion: { short: 'Le Bilan', full: 'Conclusion' },
  finale: { short: 'Le Verdict', full: 'Le Dernier Mot' },
  confirmation: { short: 'Terminé', full: 'Confirmation' },
};

/**
 * Phase order for timeline
 */
const PHASE_ORDER: TastingPhase[] = [
  'quick',
  'presentation',
  'cold_draw',
  'first_third',
  'second_third',
  'final_third',
  'conclusion',
  'finale',
];

interface TimelinePhase {
  id: TastingPhase;
  label: string;
  shortLabel: string;
  state: 'locked' | 'available' | 'current' | 'completed';
}

/**
 * Tasting Timeline Component
 * Timeline de progression avec dots
 *
 * Responsive:
 * - Desktop (≥768px): Vertical à gauche
 * - Mobile (<768px): Horizontal en haut (sticky)
 *
 * Features:
 * - Dots avec états (locked, available, current, completed)
 * - Label de la phase courante
 * - Click pour scroll vers une phase (si débloquée)
 * - Animation smooth lors des changements
 */
@Component({
  selector: 'app-tasting-timeline',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Mobile: Horizontal Timeline (sticky top) -->
    <div class="md:hidden sticky top-[73px] z-[80] bg-zinc-900 border-b border-zinc-800 px-6 py-4">
      <!-- Dots avec ligne de connexion - justify-between pour répartition uniforme -->
      <div class="relative flex items-center justify-between mb-4">
        <!-- Wrapper pour les lignes (même zone que les dots) -->
        <div class="absolute inset-x-0 top-1/2 -translate-y-1/2">
          <!-- Ligne de fond (grise) -->
          <div class="absolute inset-x-0 h-0.5 bg-zinc-700"></div>
          <!-- Ligne de progression (gold) - synchronisée avec les dots -->
          <div
            class="absolute left-0 h-0.5 rounded-full bg-gradient-to-r from-gold-600 via-gold-500 to-gold-400 bar-glow transition-all duration-300 ease-out"
            [style.width.%]="progressPercentage()"
          ></div>
        </div>

        <!-- Dots -->
        @for (phase of timelinePhases(); track phase.id) {
          <button
            type="button"
            (click)="handlePhaseClick(phase)"
            [disabled]="phase.state === 'locked'"
            [class]="getPhaseClasses(phase)"
            [title]="phase.label"
            class="relative z-10 flex items-center justify-center"
          >
            <div [class]="getDotClasses(phase)"></div>
          </button>
        }
      </div>

      <!-- Current Phase Label (Grid overlay for crossfade) -->
      <div class="text-center relative h-10">
        <div class="grid grid-cols-1 grid-rows-1">
          @for (phaseId of getPhaseOrder(); track phaseId) {
            <div
              class="col-start-1 row-start-1 text-lg font-display text-gold-500 tracking-wide transition-all duration-300 ease-out"
              [class.opacity-0]="currentPhase() !== phaseId"
              [class.translate-y-[-10px]]="currentPhase() !== phaseId && currentPhaseIndex() > getPhaseOrder().indexOf(phaseId)"
              [class.translate-y-[10px]]="currentPhase() !== phaseId && currentPhaseIndex() < getPhaseOrder().indexOf(phaseId)"
              [class.pointer-events-none]="currentPhase() !== phaseId"
            >
              {{ getPhaseLabel(phaseId) }}
            </div>
          }
        </div>
      </div>
    </div>

    <!-- Desktop: Vertical Timeline (fixed left) -->
    <div class="hidden md:block fixed left-0 top-[73px] bottom-0 w-20 bg-zinc-900 border-r border-zinc-800 z-[80]">
      <!-- justify-between avec padding vertical pour répartition uniforme -->
      <div class="relative h-full flex flex-col items-center justify-between py-8">
        <!-- Wrapper pour les lignes verticales (même zone que les dots) -->
        <div class="absolute inset-y-8 left-1/2 -translate-x-1/2 w-0.5">
          <!-- Ligne de fond (grise) -->
          <div class="absolute inset-y-0 w-full bg-zinc-700"></div>
          <!-- Ligne de progression (gold) - synchronisée avec les dots -->
          <div
            class="absolute top-0 w-full rounded-full bg-gradient-to-b from-gold-600 via-gold-500 to-gold-400 bar-glow transition-all duration-300 ease-out"
            [style.height.%]="progressPercentage()"
          ></div>
        </div>

        <!-- Dots -->
        @for (phase of timelinePhases(); track phase.id) {
          <button
            type="button"
            (click)="handlePhaseClick(phase)"
            [disabled]="phase.state === 'locked'"
            [class]="getPhaseClasses(phase)"
            [title]="phase.label"
            class="group relative z-10"
          >
            <!-- Dot -->
            <div [class]="getDotClasses(phase)"></div>

            <!-- Label (on hover) -->
            <div class="absolute left-full ml-4 px-3 py-1 bg-zinc-800 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap pointer-events-none">
              <span class="text-xs text-smoke-200">{{ phase.shortLabel }}</span>
            </div>
          </button>
        }
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: contents;
    }

    /* Pulse subtil sur le dot actif - premium discret */
    @keyframes pulse-glow {
      0%, 100% {
        box-shadow: 0 0 0 0 rgba(212, 175, 55, 0.3);
      }
      50% {
        box-shadow: 0 0 0 6px rgba(212, 175, 55, 0);
      }
    }

    .dot-pulse {
      animation: pulse-glow 2s ease-in-out infinite;
    }

    /* Glow subtil sur la barre de progression */
    .bar-glow {
      box-shadow: 0 0 8px rgba(212, 175, 55, 0.3);
    }
  `],
})
export class TastingTimelineComponent {
  // Inputs
  currentPhase = input.required<TastingPhase>();
  completedPhases = input<Set<TastingPhase>>(new Set());
  revealedPhases = input<Set<TastingPhase>>(new Set());
  isDiscoveryMode = input<boolean>(false);

  // Outputs
  phaseClicked = output<TastingPhase>();

  // Computed
  readonly timelinePhases = computed((): TimelinePhase[] => {
    const current = this.currentPhase();
    const completed = this.completedPhases();
    const revealed = this.revealedPhases();

    return PHASE_ORDER.map(phaseId => {
      const labels = PHASE_LABELS[phaseId];
      let state: TimelinePhase['state'] = 'locked';

      if (phaseId === current) {
        state = 'current';
      } else if (completed.has(phaseId)) {
        state = 'completed';
      } else if (revealed.has(phaseId)) {
        state = 'available';
      }

      return {
        id: phaseId,
        label: labels.full,
        shortLabel: labels.short,
        state,
      };
    });
  });

  /**
   * Retourne l'ordre des phases
   */
  getPhaseOrder(): TastingPhase[] {
    return PHASE_ORDER;
  }

  /**
   * Retourne le label d'une phase
   */
  getPhaseLabel(phaseId: TastingPhase): string {
    return PHASE_LABELS[phaseId]?.full || '';
  }

  /**
   * Index de la phase courante dans l'ordre
   */
  readonly currentPhaseIndex = computed(() => {
    return PHASE_ORDER.indexOf(this.currentPhase());
  });

  /**
   * Calcule le pourcentage de progression de la timeline
   * Basé sur la phase courante (0-100%)
   * Formule dot-à-dot: (currentIndex / (totalPhases - 1)) * 100
   * - Index 0 (premier dot) → 0%
   * - Index max (dernier dot) → 100%
   */
  readonly progressPercentage = computed(() => {
    const currentIndex = this.currentPhaseIndex();
    if (currentIndex < 0) return 0;

    const totalPhases = PHASE_ORDER.length;
    if (totalPhases <= 1) return 100; // Edge case

    // Barre de dot à dot (pas de 0% à 100% du conteneur)
    return (currentIndex / (totalPhases - 1)) * 100;
  });

  /**
   * Vérifie si une phase a été passée (index ≤ currentIndex)
   */
  isPhaseActive(phaseId: TastingPhase): boolean {
    const phaseIndex = PHASE_ORDER.indexOf(phaseId);
    return phaseIndex <= this.currentPhaseIndex();
  }

  getPhaseClasses(phase: TimelinePhase): string {
    const base = 'relative transition-all duration-300';
    const disabled = phase.state === 'locked' ? 'cursor-not-allowed opacity-30' : 'cursor-pointer hover:scale-110';
    return `${base} ${disabled}`;
  }

  getDotClasses(phase: TimelinePhase): string {
    const base = 'rounded-full transition-all duration-300';

    // Vérifie si la phase est active (passée ou courante)
    const isActive = this.isPhaseActive(phase.id);

    // Size + scale pour les phases actives
    let size = 'w-2 h-2 md:w-3 md:h-3';
    if (phase.state === 'current') {
      size = isActive ? 'w-3 h-3 md:w-4 md:h-4 scale-125' : 'w-3 h-3 md:w-4 md:h-4';
    } else if (isActive) {
      size = 'w-2.5 h-2.5 md:w-3.5 md:h-3.5 scale-110';
    }

    // Couleur: gold pour les phases actives, sinon states classiques
    let color = 'bg-zinc-800';
    if (phase.state === 'current') {
      // Pulse subtil sur le dot actif
      color = 'bg-gold-500 ring-2 ring-gold-500/30 dot-pulse';
    } else if (isActive) {
      color = 'bg-gold-500';
    } else if (phase.state === 'available') {
      color = 'bg-zinc-600';
    }

    return `${base} ${size} ${color}`;
  }

  handlePhaseClick(phase: TimelinePhase): void {
    if (phase.state !== 'locked') {
      this.phaseClicked.emit(phase.id);
    }
  }
}
