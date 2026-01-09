import {
  Component,
  inject,
  effect,
  ViewChild,
  ElementRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { IconDirective, InputComponent } from '@cigar-platform/shared/ui';
import { ExploreHeaderService } from '../../../../core/services/explore-header.service';

/**
 * Mobile Header for Explore Page
 *
 * Fixed header with search input for /explore route
 * Communicates with explore.page via ExploreHeaderService
 *
 * Layout:
 * - Search input (full width when not focused)
 * - Cancel button (appears when focused)
 *
 * Hidden on desktop (≥768px) - desktop uses top-tabs
 */
@Component({
  selector: 'app-mobile-header-explore',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IconDirective, InputComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header
      class="fixed top-0 left-0 right-0 z-40 md:hidden bg-smoke-700"
      style="
        padding-top: env(safe-area-inset-top);
        -webkit-transform: translateZ(0);
        transform: translateZ(0);
      "
    >
      <!-- Content container -->
      <div class="px-4 pb-3 pt-3">
        <!-- Search Input Row -->
        <div class="flex items-center gap-3">
          <div class="flex-1" (focusin)="onFocus()">
            <ui-input
              #searchInput
              type="search"
              placeholder="Rechercher..."
              [control]="searchControl"
              [suffixIcon]="true"
            >
              <i slot="suffix-icon" uiIcon name="search" class="w-5 h-5 text-smoke-400"></i>
            </ui-input>
          </div>

          <!-- Cancel Button (visible when focused) -->
          @if (headerService.isSearchMode()) {
            <button
              type="button"
              class="text-sm text-gold-500 hover:text-gold-400 transition-colors whitespace-nowrap"
              (click)="onCancel()"
            >
              Annuler
            </button>
          }
        </div>

        <!-- Search Hint -->
        <p class="text-xs text-smoke-400 mt-2">
          Découvrez cigares, marques et aficionados
        </p>
      </div>
    </header>
  `,
})
export class MobileHeaderExploreComponent {
  @ViewChild('searchInput') searchInputRef!: ElementRef<HTMLInputElement>;

  readonly headerService = inject(ExploreHeaderService);

  // Local form control synced with service
  readonly searchControl = new FormControl('');

  constructor() {
    // Sync FormControl → Service
    this.searchControl.valueChanges.subscribe((value) => {
      this.headerService.setSearchValue(value ?? '');
    });

    // Sync Service → FormControl (for external updates like reset)
    effect(() => {
      const serviceValue = this.headerService.searchValue();
      if (this.searchControl.value !== serviceValue) {
        this.searchControl.setValue(serviceValue, { emitEvent: false });
      }
    });
  }

  onFocus(): void {
    this.headerService.setFocused(true);
  }

  onCancel(): void {
    this.headerService.cancel();
    this.searchControl.setValue('', { emitEvent: false });
    this.searchInputRef?.nativeElement?.blur();
  }
}