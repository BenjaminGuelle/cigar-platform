import {
  Component,
  input,
  output,
  signal,
  computed,
  effect,
  inject,
  HostListener,
  WritableSignal,
  Signal,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IconDirective } from '../../directives/icon';
import { SearchResultGroupComponent } from '../search-result-group';
import { SearchResultItemComponent, type SearchResultIconBadge } from '../search-result-item';
import { ModalComponent } from '../modal';
import clsx from 'clsx';

/**
 * Club Search Result Item
 * Extended with display formatting for UI
 */
export interface ClubSearchResultItem {
  id: string;
  name: string;
  description: string | null;
  visibility: 'PUBLIC' | 'PRIVATE';
  memberCount: number;
  avatarUrl: string | null;
  // Computed for display
  subtitle: string;
  iconBadge: SearchResultIconBadge;
}

/**
 * Global Search Modal Component
 *
 * Intelligent search modal accessible from anywhere in the app
 * Command Palette / Spotlight inspired
 *
 * Features:
 * - Single search input (debounced)
 * - Grouped results by entity type
 * - Keyboard navigation (↑↓ Enter Esc)
 * - Non-destructive (preserves context)
 * - Popover style on desktop (from search icon)
 * - Full-screen on mobile
 *
 * Design Philosophy:
 * - Usage-first, not browsing-first
 * - Intentional discovery
 * - Minimal, focused interface
 * - Consistent with app modal system
 *
 * Architecture:
 * - Uses shared ModalComponent (position: right)
 * - Receives search results from parent
 * - Emits navigation events
 * - Stateless (controlled component)
 *
 * MVP: Clubs only
 * Future: Users, Events, Cigars
 */

@Component({
  selector: 'ui-global-search-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IconDirective,
    SearchResultGroupComponent,
    SearchResultItemComponent,
    ModalComponent,
  ],
  templateUrl: './global-search-modal.component.html',
})
export class GlobalSearchModalComponent {
  #router = inject(Router);

  @ViewChild('searchInput') searchInputRef?: ElementRef<HTMLInputElement>;

  // Inputs
  readonly isOpen = input<boolean>(false);
  readonly loading = input<boolean>(false);
  readonly clubResults = input<ClubSearchResultItem[]>([]);

  // Outputs
  readonly close = output<void>();
  readonly searchQueryChanged = output<string>();
  readonly resultClicked = output<{ id: string; type: 'club' }>();

  // Internal State
  readonly searchControl = new FormControl('');
  readonly #activeResultIndex: WritableSignal<number> = signal<number>(-1);

  // Computed
  readonly hasResults: Signal<boolean> = computed<boolean>(() => {
    return this.clubResults().length > 0;
  });

  readonly showEmpty: Signal<boolean> = computed<boolean>(() => {
    const query = this.searchControl.value?.trim() || '';
    return query.length > 0 && !this.loading() && !this.hasResults();
  });

  constructor() {
    // Focus input when modal opens
    effect(() => {
      if (this.isOpen()) {
        // Use setTimeout to ensure DOM is ready
        setTimeout(() => {
          this.searchInputRef?.nativeElement.focus();
        }, 100);
      } else {
        // Reset when closed
        this.searchControl.setValue('');
        this.#activeResultIndex.set(-1);
      }
    });

    // Emit search query changes - Use valueChanges observable, not effect!
    this.searchControl.valueChanges.subscribe((query) => {
      this.searchQueryChanged.emit(query || '');
    });

    // Reset active index when results change
    effect(() => {
      const results = this.clubResults();
      if (results.length > 0) {
        this.#activeResultIndex.set(0);
      } else {
        this.#activeResultIndex.set(-1);
      }
    });
  }

  /**
   * Handle keyboard navigation
   */
  @HostListener('document:keydown', ['$event'])
  handleKeyboard(event: KeyboardEvent): void {
    if (!this.isOpen()) return;

    const results = this.clubResults();
    const currentIndex = this.#activeResultIndex();

    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        this.handleClose();
        break;

      case 'ArrowDown':
        event.preventDefault();
        if (results.length > 0) {
          const nextIndex = currentIndex < results.length - 1 ? currentIndex + 1 : 0;
          this.#activeResultIndex.set(nextIndex);
        }
        break;

      case 'ArrowUp':
        event.preventDefault();
        if (results.length > 0) {
          const prevIndex = currentIndex > 0 ? currentIndex - 1 : results.length - 1;
          this.#activeResultIndex.set(prevIndex);
        }
        break;

      case 'Enter':
        event.preventDefault();
        if (currentIndex >= 0 && currentIndex < results.length) {
          const result = results[currentIndex];
          this.handleResultClick(result);
        }
        break;
    }
  }

  /**
   * Handle close
   */
  handleClose(): void {
    this.close.emit();
  }

  /**
   * Handle result click
   */
  handleResultClick(result: ClubSearchResultItem): void {
    this.resultClicked.emit({ id: result.id, type: 'club' });
    this.handleClose();
  }

  /**
   * Check if result is active (keyboard navigation)
   */
  isResultActive(index: number): boolean {
    return this.#activeResultIndex() === index;
  }
}
