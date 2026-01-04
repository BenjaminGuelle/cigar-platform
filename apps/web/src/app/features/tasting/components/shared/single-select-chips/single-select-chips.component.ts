import { Component, input, output, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import clsx from 'clsx';

/**
 * Option pour le single-select
 */
export interface SingleSelectOption {
  id: string;
  label: string;
  emoji?: string;
  description?: string;
}

export type ChipVariant = 'card' | 'pill';

/**
 * SingleSelectChipsComponent
 *
 * Composant réutilisable pour les choix single-select avec progress ring.
 *
 * Flow UX:
 * 1. User clique sur un choix
 * 2. Ring de validation se remplit (900ms)
 * 3. Pendant ce délai, l'user peut changer d'avis (reset le ring)
 * 4. Ring complet → bump + emit confirmed
 *
 * Variants:
 * - 'card': Grid layout avec bordure, emoji optionnel, description optionnelle
 * - 'pill': Flex wrap layout avec pills arrondis
 *
 * Modes:
 * - immediate=false: ring animation → auto-advance
 * - immediate=true: sélection directe (multi-group patterns)
 */
@Component({
  selector: 'app-single-select-chips',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './single-select-chips.component.html',
  styleUrl: './single-select-chips.component.css',
})
export class SingleSelectChipsComponent implements OnDestroy {
  // Inputs
  readonly options = input.required<SingleSelectOption[]>();
  readonly columns = input<number>(3);
  readonly mobileColumns = input<number | null>(null);
  readonly size = input<'sm' | 'md' | 'lg'>('lg');
  readonly variant = input<ChipVariant>('card');
  readonly immediate = input<boolean>(false);
  readonly value = input<string | null>(null);

  // Outputs
  readonly confirmed = output<string>();

  // State
  readonly autoAdvancingItem = signal<string | null>(null);
  readonly validatedItem = signal<string | null>(null);

  readonly #RING_DURATION = 900;
  readonly #BUMP_DURATION = 150;
  readonly #POST_BUMP_DELAY = 200;
  #autoAdvanceTimeout: ReturnType<typeof setTimeout> | null = null;
  #bumpTimeout: ReturnType<typeof setTimeout> | null = null;
  #postBumpTimeout: ReturnType<typeof setTimeout> | null = null;

  // Expose clsx to template
  readonly clsx = clsx;

  /**
   * Grid classes based on columns input (responsive)
   * Uses explicit mapping to ensure Tailwind JIT includes classes
   */
  gridClasses(): string {
    const cols = this.columns();
    const mobileCols = this.mobileColumns();

    // Explicit mapping for Tailwind JIT compatibility
    const colsMap: Record<number, string> = {
      1: 'grid-cols-1',
      2: 'grid-cols-2',
      3: 'grid-cols-3',
      4: 'grid-cols-4',
      5: 'grid-cols-5',
      6: 'grid-cols-6',
    };

    const mdColsMap: Record<number, string> = {
      1: 'md:grid-cols-1',
      2: 'md:grid-cols-2',
      3: 'md:grid-cols-3',
      4: 'md:grid-cols-4',
      5: 'md:grid-cols-5',
      6: 'md:grid-cols-6',
    };

    if (mobileCols !== null) {
      return clsx('grid gap-3', colsMap[mobileCols] ?? 'grid-cols-2', mdColsMap[cols] ?? 'md:grid-cols-3');
    }

    return clsx('grid gap-3', colsMap[cols] ?? 'grid-cols-3');
  }

  /**
   * Emoji size based on size input
   */
  emojiSizeClass(): string {
    const sizeMap = { lg: 'text-3xl', md: 'text-2xl', sm: 'text-xl' };
    return sizeMap[this.size()];
  }

  /**
   * Label size based on size input
   */
  labelSizeClass(): string {
    const sizeMap = { lg: 'text-sm', md: 'text-xs', sm: 'text-xs' };
    return sizeMap[this.size()];
  }

  /**
   * Padding based on size input
   */
  paddingClass(): string {
    const sizeMap = { lg: 'p-6', md: 'p-4', sm: 'p-3' };
    return sizeMap[this.size()];
  }

  /**
   * Check if an option is selected
   */
  isOptionSelected(optionId: string): boolean {
    return this.value() === optionId || this.validatedItem() === optionId;
  }

  /**
   * Get card classes based on state
   */
  getCardClasses(optionId: string): string {
    const hasDescription = this.options().find(o => o.id === optionId)?.description;
    const isAdvancing = this.autoAdvancingItem() === optionId;
    const isSelected = this.isOptionSelected(optionId);

    return clsx(
      'flex flex-col transition-all',
      this.paddingClass(),
      hasDescription
        ? 'items-start gap-1 rounded-lg border-2 text-left'
        : 'items-center gap-2 rounded-xl border',
      {
        'border-zinc-800 bg-gold-500/5 chip-progress-ring': isAdvancing,
        'border-gold-500 bg-gold-500/10': isSelected && !isAdvancing,
        'border-zinc-800 hover:border-gold-500/30': !isAdvancing && !isSelected,
      }
    );
  }

  /**
   * Get pill classes based on state
   */
  getPillClasses(optionId: string): string {
    const isAdvancing = this.autoAdvancingItem() === optionId;
    const isSelected = this.isOptionSelected(optionId);

    return clsx('px-4 py-2 text-sm rounded-full transition-all', {
      'bg-zinc-900 text-smoke-300 border border-zinc-800 chip-progress-ring-pill': isAdvancing,
      'bg-gold-500 text-zinc-900 font-medium': isSelected && !isAdvancing,
      'bg-zinc-900 text-smoke-300 border border-zinc-800 hover:border-gold-500/30': !isAdvancing && !isSelected,
    });
  }

  /**
   * Select an option
   */
  selectOption(optionId: string): void {
    if (this.immediate()) {
      this.validatedItem.set(optionId);
      this.confirmed.emit(optionId);
      return;
    }

    this.#clearAutoAdvance();
    this.autoAdvancingItem.set(optionId);

    // Phase 1: Ring animation (900ms)
    this.#autoAdvanceTimeout = setTimeout(() => {
      this.autoAdvancingItem.set(null);
      this.validatedItem.set(optionId);

      // Phase 2: Bump animation (150ms)
      this.#bumpTimeout = setTimeout(() => {
        // Phase 3: Post-bump delay pour voir le selected (200ms)
        this.#postBumpTimeout = setTimeout(() => {
          this.confirmed.emit(optionId);
        }, this.#POST_BUMP_DELAY);
      }, this.#BUMP_DURATION);
    }, this.#RING_DURATION);
  }

  #clearAutoAdvance(): void {
    if (this.#autoAdvanceTimeout) {
      clearTimeout(this.#autoAdvanceTimeout);
      this.#autoAdvanceTimeout = null;
    }
    if (this.#bumpTimeout) {
      clearTimeout(this.#bumpTimeout);
      this.#bumpTimeout = null;
    }
    if (this.#postBumpTimeout) {
      clearTimeout(this.#postBumpTimeout);
      this.#postBumpTimeout = null;
    }
    this.autoAdvancingItem.set(null);
    this.validatedItem.set(null);
  }

  ngOnDestroy(): void {
    this.#clearAutoAdvance();
  }
}
