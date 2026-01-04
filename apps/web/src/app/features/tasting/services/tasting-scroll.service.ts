import { Injectable, signal, effect } from '@angular/core';
import type { TastingPhase } from './tasting-orchestrator.service';

/**
 * Mapping des IDs de section DOM vers les phases
 */
const SECTION_TO_PHASE: Record<string, TastingPhase> = {
  'phase-quick': 'quick',
  'phase-presentation': 'presentation',
  'phase-cold-draw': 'cold_draw',
  'phase-first-third': 'first_third',
  'phase-second-third': 'second_third',
  'phase-final-third': 'final_third',
  'phase-conclusion': 'conclusion',
  'phase-finale': 'finale',
  'phase-confirmation': 'confirmation',
};

/**
 * Tasting Scroll Service
 * Gestion de la navigation smooth scroll entre les phases
 *
 * ALL STARS Architecture ⭐
 * - Single Responsibility: Scroll navigation + phase detection
 * - IntersectionObserver pour détecter la phase active
 * - Smooth scroll avec snap automatique
 * - Délai pour DOM update (phase reveal)
 *
 * Features:
 * - Scroll vers une section par ID
 * - Support async (attend DOM update)
 * - Comportement smooth + center alignment
 * - Détection automatique de la phase courante via scroll
 *
 * @example
 * ```typescript
 * const scrollService = inject(TastingScrollService);
 *
 * // Setup observer
 * scrollService.setupScrollObserver();
 *
 * // Scroll immédiat
 * scrollService.scrollTo('phase-finale');
 *
 * // Récupérer la phase courante
 * const currentPhase = scrollService.currentPhaseFromScroll();
 * ```
 */
@Injectable()
export class TastingScrollService {
  // IntersectionObserver
  #observer: IntersectionObserver | null = null;

  /**
   * Phase courante détectée par le scroll
   * Mise à jour automatiquement via IntersectionObserver
   */
  readonly currentPhaseFromScroll = signal<TastingPhase>('quick');
  /**
   * Scroll to section by ID (immediate)
   *
   * @param sectionId - Section DOM ID (e.g., 'phase-quick')
   */
  scrollTo(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }

  /**
   * Scroll to section after DOM update (async, 100ms delay)
   * Utilisé quand une nouvelle phase vient d'être révélée
   *
   * @param sectionId - Section DOM ID
   * @param delay - Delay in ms (default: 100)
   */
  scrollToAsync(sectionId: string, delay = 100): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.scrollTo(sectionId);
        resolve();
      }, delay);
    });
  }

  /**
   * Scroll to top (reset)
   */
  scrollToTop(): void {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }

  /**
   * Setup IntersectionObserver pour détecter la phase active
   * Utilise rootMargin: '-40% 0px -40% 0px' pour détecter la section au centre
   */
  setupScrollObserver(): void {
    if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') {
      return; // SSR safety
    }

    // Observer options: détecte la section au centre de l'écran
    const options: IntersectionObserverInit = {
      root: null, // viewport
      rootMargin: '-40% 0px -40% 0px', // Zone centrale (20% du viewport)
      threshold: 0, // Trigger dès qu'un pixel est visible dans la zone
    };

    // Callback: Mise à jour de la phase courante
    const callback: IntersectionObserverCallback = (entries) => {
      // Trouve l'entrée la plus visible dans la zone centrale
      const visibleEntry = entries.find(entry => entry.isIntersecting);

      if (visibleEntry) {
        const sectionId = visibleEntry.target.id;
        const phase = SECTION_TO_PHASE[sectionId];

        if (phase) {
          this.currentPhaseFromScroll.set(phase);
        }
      }
    };

    // Créer l'observer
    this.#observer = new IntersectionObserver(callback, options);

    // Observer toutes les sections de phase
    Object.keys(SECTION_TO_PHASE).forEach(sectionId => {
      const element = document.getElementById(sectionId);
      if (element) {
        this.#observer?.observe(element);
      }
    });
  }

  /**
   * Cleanup: Détruire l'observer
   */
  destroyScrollObserver(): void {
    if (this.#observer) {
      this.#observer.disconnect();
      this.#observer = null;
    }
  }
}