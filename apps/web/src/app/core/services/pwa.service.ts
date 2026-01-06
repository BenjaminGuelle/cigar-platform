import { Injectable, signal, computed, inject, PLATFORM_ID, DestroyRef, Injector, runInInjectionContext } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AnalyticsTrackingService } from './analytics.service';

/**
 * Type de plateforme détectée
 */
export type PwaPlatform = 'ios' | 'android' | 'desktop' | 'unknown';

/**
 * État du prompt d'installation
 */
export type PwaInstallState = 'idle' | 'available' | 'dismissed' | 'installed';

/**
 * Configuration pour le prompt d'installation
 */
const CONFIG = {
  /** Nombre minimum de visites avant d'afficher le prompt */
  minVisits: 2,
  /** Durée minimum de session avant d'afficher (en ms) */
  minSessionDuration: 30_000, // 30 secondes
  /** Durée avant de réafficher après dismiss (en ms) */
  dismissCooldown: 7 * 24 * 60 * 60 * 1000, // 7 jours
};

const STORAGE_KEYS = {
  visitCount: 'pwa-visit-count',
  promptDismissed: 'pwa-prompt-dismissed',
  installed: 'pwa-installed',
  hasCompletedTasting: 'pwa-has-completed-tasting',
};

/**
 * Service PWA intelligent pour gérer l'installation de l'application
 *
 * Logique d'affichage du prompt :
 * - App non installée (pas en standalone)
 * - Utilisateur n'a pas dismiss (ou dismiss > 7 jours)
 * - ET au moins UNE condition :
 *   - A complété au moins 1 dégustation
 *   - OU (visitCount >= 2 ET sessionDuration >= 30s)
 */
@Injectable({ providedIn: 'root' })
export class PwaService {
  readonly #platformId = inject(PLATFORM_ID);
  readonly #swUpdate = inject(SwUpdate, { optional: true });
  readonly #destroyRef = inject(DestroyRef);
  readonly #injector = inject(Injector);

  // Lazy-loaded analytics to avoid circular dependencies
  #analytics: AnalyticsTrackingService | null = null;
  #getAnalytics(): AnalyticsTrackingService {
    if (!this.#analytics) {
      this.#analytics = runInInjectionContext(this.#injector, () => inject(AnalyticsTrackingService));
    }
    return this.#analytics;
  }

  // État interne
  readonly #deferredPrompt = signal<BeforeInstallPromptEvent | null>(null);
  readonly #installState = signal<PwaInstallState>('idle');
  readonly #platform = signal<PwaPlatform>('unknown');
  readonly #isStandalone = signal(false);
  readonly #updateAvailable = signal(false);
  readonly #sessionStartTime = signal<number>(Date.now());
  readonly #sessionDurationMet = signal(false);

  // Signaux publics en lecture seule
  readonly installState = this.#installState.asReadonly();
  readonly platform = this.#platform.asReadonly();
  readonly isStandalone = this.#isStandalone.asReadonly();
  readonly updateAvailable = this.#updateAvailable.asReadonly();

  /** Indique si le prompt peut être affiché */
  readonly canShowPrompt = computed(() => {
    // Conditions bloquantes
    if (this.#isStandalone()) return false;
    if (this.#installState() === 'installed') return false;
    if (this.#installState() === 'dismissed' && !this.#isDismissCooldownExpired()) return false;

    // Vérifier si au moins une condition d'engagement est remplie
    const hasCompletedTasting = this.#hasCompletedTasting();
    const hasEnoughEngagement = this.#hasEnoughVisits() && this.#sessionDurationMet();

    if (!hasCompletedTasting && !hasEnoughEngagement) return false;

    // Sur non-iOS, il faut aussi le beforeinstallprompt event
    if (this.#platform() !== 'ios' && !this.#deferredPrompt()) return false;

    return true;
  });

  /** Indique si c'est iOS et nécessite des instructions manuelles */
  readonly needsIosInstructions = computed(() => {
    const state = this.#installState();
    return (
      this.#platform() === 'ios' &&
      !this.#isStandalone() &&
      state !== 'dismissed' &&
      state !== 'installed'
    );
  });

  /** Indique si le prompt natif est disponible (Android/Chrome) */
  readonly hasNativePrompt = computed(() => {
    return this.#deferredPrompt() !== null;
  });

  constructor() {
    if (isPlatformBrowser(this.#platformId)) {
      this.#initPlatformDetection();
      this.#initInstallPromptListener();
      this.#initStandaloneDetection();
      this.#loadStoredState();
      this.#initServiceWorkerUpdates();
      this.#startSessionTimer();
    }
  }

  /**
   * Détecte la plateforme actuelle
   */
  #initPlatformDetection(): void {
    const ua = navigator.userAgent.toLowerCase();

    if (/iphone|ipad|ipod/.test(ua)) {
      this.#platform.set('ios');
    } else if (/android/.test(ua)) {
      this.#platform.set('android');
    } else if (/windows|macintosh|linux/.test(ua) && !/mobile/.test(ua)) {
      this.#platform.set('desktop');
    } else {
      this.#platform.set('unknown');
    }
  }

  /**
   * Écoute l'événement beforeinstallprompt (Chrome/Android)
   */
  #initInstallPromptListener(): void {
    window.addEventListener('beforeinstallprompt', (event: Event) => {
      // Empêcher le prompt automatique
      event.preventDefault();

      // Stocker l'événement pour utilisation ultérieure
      this.#deferredPrompt.set(event as BeforeInstallPromptEvent);

      // Le prompt devient potentiellement available
      if (this.#installState() === 'idle') {
        this.#installState.set('available');
      }
    });

    // Détecter quand l'app est installée
    window.addEventListener('appinstalled', () => {
      this.#installState.set('installed');
      this.#deferredPrompt.set(null);
      this.#setStorageItem(STORAGE_KEYS.installed, 'true');
    });
  }

  /**
   * Détecte si l'app est en mode standalone (déjà installée)
   */
  #initStandaloneDetection(): void {
    // Méthode 1: Media query
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

    // Méthode 2: iOS Safari
    const isIosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true;

    this.#isStandalone.set(isStandalone || isIosStandalone);

    if (this.#isStandalone()) {
      this.#installState.set('installed');
    }

    // Écouter les changements de mode d'affichage
    window.matchMedia('(display-mode: standalone)').addEventListener('change', (e) => {
      this.#isStandalone.set(e.matches);
      if (e.matches) {
        this.#installState.set('installed');
      }
    });
  }

  /**
   * Charge l'état stocké en localStorage et incrémente le compteur de visites
   */
  #loadStoredState(): void {
    // Vérifier si déjà installé
    if (this.#getStorageItem(STORAGE_KEYS.installed) === 'true') {
      this.#installState.set('installed');
      return;
    }

    // Incrémenter le compteur de visites
    const currentVisits = parseInt(this.#getStorageItem(STORAGE_KEYS.visitCount) || '0', 10);
    this.#setStorageItem(STORAGE_KEYS.visitCount, String(currentVisits + 1));

    // Vérifier le cooldown de dismiss
    const dismissedAt = this.#getStorageItem(STORAGE_KEYS.promptDismissed);
    if (dismissedAt && !this.#isDismissCooldownExpired()) {
      this.#installState.set('dismissed');
    }
  }

  /**
   * Démarre le timer de session pour vérifier la durée
   */
  #startSessionTimer(): void {
    this.#sessionStartTime.set(Date.now());

    // Vérifier toutes les 5 secondes si la durée minimum est atteinte
    const checkInterval = setInterval(() => {
      const elapsed = Date.now() - this.#sessionStartTime();
      if (elapsed >= CONFIG.minSessionDuration) {
        this.#sessionDurationMet.set(true);
        clearInterval(checkInterval);
      }
    }, 5000);

    // Cleanup on destroy
    this.#destroyRef.onDestroy(() => clearInterval(checkInterval));
  }

  /**
   * Vérifie si le cooldown de dismiss est expiré
   */
  #isDismissCooldownExpired(): boolean {
    const dismissedAt = this.#getStorageItem(STORAGE_KEYS.promptDismissed);
    if (!dismissedAt) return true;

    const elapsed = Date.now() - parseInt(dismissedAt, 10);
    return elapsed >= CONFIG.dismissCooldown;
  }

  /**
   * Vérifie si l'utilisateur a assez de visites
   */
  #hasEnoughVisits(): boolean {
    const visits = parseInt(this.#getStorageItem(STORAGE_KEYS.visitCount) || '0', 10);
    return visits >= CONFIG.minVisits;
  }

  /**
   * Vérifie si l'utilisateur a complété au moins une dégustation
   */
  #hasCompletedTasting(): boolean {
    return this.#getStorageItem(STORAGE_KEYS.hasCompletedTasting) === 'true';
  }

  /**
   * Initialise la gestion des mises à jour du service worker
   */
  #initServiceWorkerUpdates(): void {
    if (!this.#swUpdate?.isEnabled) {
      return;
    }

    this.#swUpdate.versionUpdates
      .pipe(
        filter((evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY'),
        takeUntilDestroyed(this.#destroyRef)
      )
      .subscribe(() => {
        this.#updateAvailable.set(true);
      });
  }

  // ==================== PUBLIC API ====================

  /**
   * Affiche le prompt d'installation natif (Android/Chrome)
   * @returns Promise<boolean> - true si installé, false sinon
   */
  async promptInstall(): Promise<boolean> {
    const prompt = this.#deferredPrompt();

    if (!prompt) {
      return false;
    }

    // Track prompt shown
    this.#getAnalytics().track('pwa_prompt_shown', {
      platform: this.#platform(),
    });

    // Afficher le prompt
    prompt.prompt();

    // Attendre la réponse de l'utilisateur
    const { outcome } = await prompt.userChoice;

    if (outcome === 'accepted') {
      this.#installState.set('installed');
      this.#setStorageItem(STORAGE_KEYS.installed, 'true');
      this.#deferredPrompt.set(null);

      // Track install
      this.#getAnalytics().track('pwa_install', {
        platform: this.#platform(),
      });
      return true;
    }

    return false;
  }

  /**
   * Marque le prompt comme refusé (dismiss)
   * Le prompt ne sera plus affiché pendant 7 jours
   */
  dismissPrompt(): void {
    this.#installState.set('dismissed');
    this.#setStorageItem(STORAGE_KEYS.promptDismissed, String(Date.now()));

    // Track dismiss
    this.#getAnalytics().track('pwa_dismiss', {
      platform: this.#platform(),
    });
  }

  /**
   * Marque qu'une dégustation a été complétée
   * Appelé par le TastingStore après une complétion réussie
   */
  markTastingCompleted(): void {
    this.#setStorageItem(STORAGE_KEYS.hasCompletedTasting, 'true');
  }

  /**
   * Applique une mise à jour du service worker et recharge l'app
   */
  applyUpdate(): void {
    if (this.#swUpdate?.isEnabled) {
      this.#swUpdate.activateUpdate().then(() => {
        window.location.reload();
      });
    }
  }

  /**
   * Vérifie manuellement les mises à jour
   */
  async checkForUpdate(): Promise<boolean> {
    if (!this.#swUpdate?.isEnabled) {
      return false;
    }

    return this.#swUpdate.checkForUpdate();
  }

  // ==================== STORAGE HELPERS ====================

  #getStorageItem(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  #setStorageItem(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Ignorer les erreurs de localStorage
    }
  }
}

/**
 * Interface pour l'événement beforeinstallprompt
 * (Non standard, spécifique Chrome/Edge)
 */
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}