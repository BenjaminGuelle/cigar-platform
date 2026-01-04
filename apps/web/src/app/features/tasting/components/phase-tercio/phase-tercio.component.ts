import { Component, output, signal, input, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlavorPickerComponent } from '../flavor-picker/flavor-picker.component';
import { IconDirective, ButtonComponent } from '@cigar-platform/shared/ui';
import type { FlavorTag } from '../../models/tasting-state.model';

export type TercioType = 'first' | 'second' | 'final';

interface TercioContent {
  tastesIntro: string;
  aromasIntro: string;
  title: string;
  closing: string;
}

const TERCIO_CONTENT: Record<TercioType, TercioContent> = {
  first: {
    tastesIntro: "L'éveil... Les premières notes se révèlent.",
    aromasIntro: "Au nez, quelles fragrances s'échappent ?",
    title: "L'Éveil capturé",
    closing: 'Le premier chapitre se ferme...',
  },
  second: {
    tastesIntro: 'Le cœur bat... La complexité s\'intensifie.',
    aromasIntro: "Au nez, quelles fragrances s'échappent ?",
    title: 'Le Cœur capturé',
    closing: "Le deuxième acte s'achève...",
  },
  final: {
    tastesIntro: 'Le finale... La dernière danse commence.',
    aromasIntro: "Les dernières volutes s'envolent...",
    title: 'Le Finale saisi',
    closing: "La fumée s'éteint... Le voyage tire à sa fin.",
  },
};

/**
 * Phase Tercio Component (Unified)
 * Handles all three tercios: first_third, second_third, final_third
 *
 * ALL STARS Architecture ⭐
 * - Single parameterized component instead of 3 duplicated ones
 * - Content computed from tercio type
 *
 * Flow: Tastes → Aromas → Done
 */
type TercioStep = 'tastes' | 'aromas' | 'done';

@Component({
  selector: 'app-phase-tercio',
  standalone: true,
  imports: [CommonModule, FlavorPickerComponent, IconDirective, ButtonComponent],
  templateUrl: './phase-tercio.component.html',
  styles: [`
    .question-step { animation: question-enter 0.25s ease-out; }
    @keyframes question-enter {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .header-summary { animation: header-update 0.3s ease-out; }
    @keyframes header-update {
      from { opacity: 0.7; }
      to { opacity: 1; }
    }
  `],
})
export class PhaseTercioComponent {
  tercio = input.required<TercioType>();

  initialTastes = input<FlavorTag[] | null | undefined>();
  initialAromas = input<FlavorTag[] | null | undefined>();

  content = computed(() => TERCIO_CONTENT[this.tercio()]);

  currentStep = signal<TercioStep>('tastes');
  tastesValue = signal<FlavorTag[]>([]);
  aromasValue = signal<FlavorTag[]>([]);

  #hasRestored = false;

  dataChange = output<{ tastes: FlavorTag[]; aromas: FlavorTag[] }>();
  done = output<void>();

  constructor() {
    effect(() => {
      if (this.#hasRestored) return;
      this.#hasRestored = true; // Mark immediately to prevent re-triggering

      const tastes = this.initialTastes();
      const aromas = this.initialAromas();

      const hasTastes = tastes && tastes.length > 0;
      const hasAromas = aromas && aromas.length > 0;

      if (!hasTastes && !hasAromas) return;

      if (hasTastes) this.tastesValue.set(tastes);
      if (hasAromas) this.aromasValue.set(aromas);

      if (hasTastes && hasAromas) {
        this.currentStep.set('done');
        this.done.emit();
      } else if (hasTastes) {
        this.currentStep.set('aromas');
      }
    });
  }

  handleTastesChange(tastes: FlavorTag[]): void {
    this.tastesValue.set(tastes);
    this.emitData();
  }

  goToAromas(): void { this.currentStep.set('aromas'); }

  handleAromasChange(aromas: FlavorTag[]): void {
    this.aromasValue.set(aromas);
    this.emitData();
  }

  goToDone(): void {
    this.currentStep.set('done');
    this.done.emit();
  }

  emitData(): void {
    this.dataChange.emit({
      tastes: this.tastesValue(),
      aromas: this.aromasValue(),
    });
  }
}
