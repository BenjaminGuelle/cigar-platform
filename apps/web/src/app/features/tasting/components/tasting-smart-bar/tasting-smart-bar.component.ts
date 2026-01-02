import { Component, input, output, OnInit, OnDestroy, signal, computed, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconDirective } from '@cigar-platform/shared/ui';
import type { TastingPhase } from '../../services/tasting-orchestrator.service';

/**
 * Action labels by phase
 */
const PHASE_ACTION_LABELS: Record<TastingPhase, { next: string }> = {
  quick: { next: 'Poursuivre' },
  presentation: { next: 'Tercio suivant' },
  cold_draw: { next: 'Tercio suivant' },
  first_third: { next: 'Tercio suivant' },
  second_third: { next: 'Tercio suivant' },
  final_third: { next: 'Conclure' },
  conclusion: { next: 'Le Dernier Mot' },
  finale: { next: 'Sceller' },
  confirmation: { next: '' }, // Hidden on confirmation
};

/**
 * Tasting Smart Bar Component
 * Barre d'action flottante en bas de l'écran
 *
 * Features:
 * - Bouton gauche (Ghost): "Le Verdict" → scroll to finale
 * - Bouton droit (Pill Gold): Label contextuel selon la phase
 * - Chrono au centre
 * - Animations fade sur les labels
 * - Safe area inset iOS
 */
@Component({
  selector: 'app-tasting-smart-bar',
  standalone: true,
  imports: [CommonModule, IconDirective],
  template: `
    <div class="fixed bottom-0 left-0 right-0 z-[90] bg-zinc-950/60 backdrop-blur-md border-t border-zinc-800"
         [style.padding-bottom.px]="safeAreaBottom()">
      <div class="flex items-center justify-between gap-4 px-6 py-3">
        <!-- Bouton Gauche: Le Verdict -->
        @if (currentPhase() !== 'finale' && currentPhase() !== 'confirmation') {
          <button
            type="button"
            (click)="scrollToVerdict()"
            class="flex items-center gap-2 px-4 py-2 text-sm text-smoke-400 hover:text-gold-500 transition-colors"
          >
            <i name="arrow-right" class="w-4 h-4"></i>
            <span>Le Verdict</span>
          </button>
        }
        @else {
          <div class="w-24"></div>
        }

        <!-- Chrono Centre -->
        <div class="flex items-center gap-2 text-sm font-mono text-smoke-400">
          <i name="flame" class="w-4 h-4 text-gold-500"></i>
          <span>{{ elapsedTime() }}</span>
        </div>

        <!-- Bouton Droit: Action Contextuelle -->
        @if (currentPhase() !== 'confirmation') {
          <button
            type="button"
            (click)="handleNext()"
            [disabled]="isLoading()"
            class="px-6 py-2 text-sm font-medium text-zinc-900 bg-gold-500 rounded-full hover:bg-gold-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            [class.opacity-0]="isLabelChanging()"
            [style.transition]="'opacity 200ms ease-in-out'"
          >
            @if (isLoading()) {
              <i name="spinner" class="w-4 h-4 animate-spin"></i>
            }
            <span>{{ nextLabel() }}</span>
          </button>
        }
        @else {
          <div class="w-24"></div>
        }
      </div>
    </div>
  `,
})
export class TastingSmartBarComponent implements OnInit, OnDestroy {
  // Inputs
  currentPhase = input.required<TastingPhase>();
  elapsedTime = input.required<string>();
  isLoading = input<boolean>(false);

  // Outputs
  scrollToSection = output<string>();
  nextAction = output<void>();

  // State
  readonly isLabelChanging = signal(false);
  readonly safeAreaBottom = signal(0);

  // Computed
  readonly nextLabel = computed(() => {
    const phase = this.currentPhase();
    return PHASE_ACTION_LABELS[phase]?.next || 'Continuer';
  });

  #previousPhase: TastingPhase | null = null;

  constructor() {
    // Detect safe area bottom (iOS)
    if (typeof window !== 'undefined') {
      const computed = window.getComputedStyle(document.documentElement);
      const safeArea = computed.getPropertyValue('--sat') || '0px';
      this.safeAreaBottom.set(parseInt(safeArea, 10) || 0);
    }

    // Animate label change
    effect(() => {
      const phase = this.currentPhase();

      if (this.#previousPhase && this.#previousPhase !== phase) {
        // Fade out
        this.isLabelChanging.set(true);

        // Fade in after 200ms
        setTimeout(() => {
          this.isLabelChanging.set(false);
        }, 200);
      }

      this.#previousPhase = phase;
    });
  }

  ngOnInit(): void {
    // Initialization if needed
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  scrollToVerdict(): void {
    this.scrollToSection.emit('phase-finale');
  }

  handleNext(): void {
    this.nextAction.emit();
  }
}
