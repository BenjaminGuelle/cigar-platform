import { Injectable, signal, WritableSignal } from '@angular/core';

/**
 * Loading Service
 * Manages app-wide loading states and controls the bootstrap loader
 */
@Injectable({
  providedIn: 'root',
})
export class LoadingService {
  #appLoading: WritableSignal<boolean> = signal<boolean>(true);
  #authLoading: WritableSignal<boolean> = signal<boolean>(true);

  readonly appLoading = this.#appLoading.asReadonly();
  readonly authLoading = this.#authLoading.asReadonly();

  /**
   * Hide the app loader (called when Angular is bootstrapped)
   */
  hideAppLoader(): void {
    const loader = document.getElementById('app-loader');
    if (loader) {
      loader.classList.add('fade-out');
      setTimeout(() => {
        loader.remove();
        this.#appLoading.set(false);
      }, 600); // Match CSS transition duration
    } else {
      this.#appLoading.set(false);
    }
  }

  /**
   * Set auth loading state
   */
  setAuthLoading(loading: boolean): void {
    this.#authLoading.set(loading);
  }

  /**
   * Show app loader (can be called manually for full-page loading)
   */
  showAppLoader(): void {
    this.#appLoading.set(true);
  }
}