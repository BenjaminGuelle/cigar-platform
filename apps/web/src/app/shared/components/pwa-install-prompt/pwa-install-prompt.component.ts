import { Component, inject, computed, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalComponent, ButtonComponent, IconDirective } from '@cigar-platform/shared/ui';
import { PwaService } from '../../../core/services/pwa.service';

/**
 * Composant de prompt d'installation PWA adaptatif
 *
 * S'adapte automatiquement à la plateforme :
 * - Android/Chrome : Bouton d'installation natif
 * - iOS : Instructions pour "Ajouter à l'écran d'accueil"
 * - Desktop : Bouton d'installation Chrome/Edge
 *
 * Design : Smoke & Gold, utilise ui-modal centered
 */
@Component({
  selector: 'app-pwa-install-prompt',
  standalone: true,
  imports: [CommonModule, ModalComponent, ButtonComponent, IconDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Modal d'installation PWA -->
    <ui-modal
      [isOpen]="showPrompt()"
      variant="dialog"
      size="sm"
      [showCloseButton]="false"
      (close)="onDismiss()"
    >
      <div class="p-6 space-y-6">
        <!-- Header avec logo -->
        <div class="flex items-center gap-4">
          <div class="w-14 h-14 rounded-xl bg-smoke-900 border border-gold-500/30 flex items-center justify-center shrink-0">
            <span class="text-gold-500 font-display text-xl">C&C</span>
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="text-smoke-50 font-semibold text-lg">Installer Cigar & Club</h3>
            <p class="text-smoke-400 text-sm">Accédez rapidement à l'app depuis votre écran d'accueil</p>
          </div>
          <button
            (click)="onDismiss()"
            class="w-8 h-8 flex items-center justify-center text-smoke-400 hover:text-smoke-200 transition-colors shrink-0"
            aria-label="Fermer"
          >
            <i name="x" class="w-5 h-5"></i>
          </button>
        </div>

        <!-- Contenu adaptatif selon la plateforme -->
        @if (pwaService.needsIosInstructions()) {
          <!-- Instructions iOS -->
          <div class="space-y-3">
            <p class="text-smoke-300 text-sm">Pour installer l'application sur iOS :</p>
            <ol class="space-y-3">
              <li class="flex items-center gap-3 text-smoke-200 text-sm">
                <span class="w-7 h-7 rounded-full bg-gold-500/20 text-gold-500 flex items-center justify-center text-xs font-bold shrink-0">1</span>
                <span>Appuyez sur <i name="share" class="w-4 h-4 inline-block text-gold-500 align-middle"></i> (Partager)</span>
              </li>
              <li class="flex items-center gap-3 text-smoke-200 text-sm">
                <span class="w-7 h-7 rounded-full bg-gold-500/20 text-gold-500 flex items-center justify-center text-xs font-bold shrink-0">2</span>
                <span>Sélectionnez <strong class="text-gold-500">« Sur l'écran d'accueil »</strong></span>
              </li>
              <li class="flex items-center gap-3 text-smoke-200 text-sm">
                <span class="w-7 h-7 rounded-full bg-gold-500/20 text-gold-500 flex items-center justify-center text-xs font-bold shrink-0">3</span>
                <span>Appuyez sur <strong class="text-gold-500">« Ajouter »</strong></span>
              </li>
            </ol>
          </div>
        } @else {
          <!-- Bouton d'installation natif (Android/Desktop) -->
          <div class="space-y-3">
            <ui-button
              variant="primary"
              [fullWidth]="true"
              icon="download"
              [loading]="installing()"
              [disabled]="installing()"
              (clicked)="onInstall()"
            >
              {{ installing() ? 'Installation...' : "Installer l'application" }}
            </ui-button>
            <p class="text-smoke-500 text-xs text-center">
              Installation rapide, sans passer par le store
            </p>
          </div>
        }

        <!-- Avantages PWA -->
        <div class="flex items-center justify-center gap-6 text-xs text-smoke-500 pt-2 border-t border-smoke-700">
          <span class="flex items-center gap-1.5">
            <i name="sparkles" class="w-3.5 h-3.5 text-gold-500/70"></i>
            Accès rapide
          </span>
          <span class="flex items-center gap-1.5">
            <i name="bell" class="w-3.5 h-3.5 text-gold-500/70"></i>
            Notifications
          </span>
          <span class="flex items-center gap-1.5">
            <i name="cloud" class="w-3.5 h-3.5 text-gold-500/70"></i>
            Mode hors-ligne
          </span>
        </div>
      </div>
    </ui-modal>

    <!-- Banner de mise à jour disponible -->
    @if (pwaService.updateAvailable()) {
      <div class="fixed top-0 left-0 right-0 z-50 bg-gold-500 text-smoke-950 px-4 py-3 flex items-center justify-between"
           [style.padding-top]="'calc(env(safe-area-inset-top) + 0.75rem)'">
        <div class="flex items-center gap-2">
          <i name="sparkles" class="w-5 h-5"></i>
          <span class="font-medium text-sm">Nouvelle version disponible</span>
        </div>
        <ui-button
          variant="secondary"
          size="sm"
          (clicked)="onUpdate()"
        >
          Mettre à jour
        </ui-button>
      </div>
    }
  `,
})
export class PwaInstallPromptComponent {
  readonly pwaService = inject(PwaService);

  readonly installing = signal(false);

  readonly showPrompt = computed(() => {
    return this.pwaService.canShowPrompt() || this.pwaService.needsIosInstructions();
  });

  async onInstall(): Promise<void> {
    this.installing.set(true);

    try {
      const installed = await this.pwaService.promptInstall();
      if (!installed) {
        // L'utilisateur a refusé, on garde le prompt visible
      }
    } finally {
      this.installing.set(false);
    }
  }

  onDismiss(): void {
    this.pwaService.dismissPrompt();
  }

  onUpdate(): void {
    this.pwaService.applyUpdate();
  }
}