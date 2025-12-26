import { Injectable, signal, WritableSignal } from '@angular/core';

/**
 * Search Modal Service
 * Manages global search modal open/close state
 *
 * Shared between:
 * - HomeComponent (modal instance)
 * - ExplorePage (auto-open trigger)
 * - Search buttons (open trigger)
 *
 * @example
 * ```typescript
 * searchModal = inject(SearchModalService);
 * searchModal.open();
 * searchModal.close();
 * ```
 */
@Injectable({
  providedIn: 'root',
})
export class SearchModalService {
  readonly #isOpen: WritableSignal<boolean> = signal<boolean>(false);
  readonly isOpen = this.#isOpen.asReadonly();

  open(): void {
    this.#isOpen.set(true);
  }

  close(): void {
    this.#isOpen.set(false);
  }

  toggle(): void {
    this.#isOpen.update((open) => !open);
  }
}
