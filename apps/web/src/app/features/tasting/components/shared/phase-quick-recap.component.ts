import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { TastingSituation, PairingType } from '@cigar-platform/shared/constants';

/**
 * Phase Quick Recap Component
 * Carte récap réutilisable pour Phase Quick (done step + expanded summary)
 *
 * ALL STARS Architecture ⭐
 * - Composant pure presentation
 * - Computed signals pour formatage
 * - Emojis + labels premium
 */
@Component({
  selector: 'app-phase-quick-recap',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="w-full bg-zinc-900/50 rounded-xl border border-zinc-800 p-4 space-y-3">
      <!-- Cigare -->
      @if (cigarName()) {
        <div class="flex items-center gap-2">
          <span>🚬</span>
          <span class="text-gold-500 font-medium">{{ cigarName() }}</span>
        </div>
      }

      <!-- Date/Heure -->
      @if (dateFormatted()) {
        <div class="flex items-center gap-2 text-sm text-smoke-400">
          <span>📅</span>
          <span>{{ dateFormatted() }} • {{ timeFormatted() }}</span>
        </div>
      }

      <!-- Situation -->
      @if (situation()) {
        <div class="flex items-center gap-2 text-sm text-smoke-300">
          <span>{{ situationEmoji() }}</span>
          <span>{{ situationLabel() }}</span>
        </div>
      }

      <!-- Pairing -->
      @if (pairing()) {
        <div class="flex items-center gap-2 text-sm text-smoke-300">
          <span>{{ pairingEmoji() }}</span>
          <span>{{ pairingLabel() }}</span>
          @if (pairingNote()) {
            <span class="text-smoke-500">— "{{ pairingNote() }}"</span>
          }
        </div>
      }

      <!-- Location -->
      @if (location()) {
        <div class="flex items-center gap-2 text-sm text-smoke-300">
          <span>📍</span>
          <span>{{ location() }}</span>
        </div>
      }
    </div>
  `,
})
export class PhaseQuickRecapComponent {
  // Inputs
  cigarName = input<string | null>(null);
  moment = input<string | null>(null);
  situation = input<TastingSituation | null>(null);
  pairing = input<PairingType | null>(null);
  pairingNote = input<string | null>(null);
  location = input<string | null>(null);

  // ==================== Computed ====================

  /**
   * Date formatée (ex: "Vendredi 3 janvier")
   */
  readonly dateFormatted = computed(() => {
    const m = this.moment();
    if (!m) return null;
    const date = new Date(m);
    if (isNaN(date.getTime())) return null;
    return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  });

  /**
   * Heure formatée (ex: "14h30")
   */
  readonly timeFormatted = computed(() => {
    const m = this.moment();
    if (!m) return null;
    const date = new Date(m);
    if (isNaN(date.getTime())) return null;
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }).replace(':', 'h');
  });

  /**
   * Emoji selon situation
   */
  readonly situationEmoji = computed(() => {
    const s = this.situation();
    const emojis: Record<TastingSituation, string> = {
      APERITIF: '🍸',
      COCKTAIL: '🍹',
      DIGESTIF: '🥃',
    };
    return s ? emojis[s] : '';
  });

  /**
   * Label selon situation
   */
  readonly situationLabel = computed(() => {
    const s = this.situation();
    const labels: Record<TastingSituation, string> = {
      APERITIF: 'Apéritif',
      COCKTAIL: 'Cocktail',
      DIGESTIF: 'Digestif',
    };
    return s ? labels[s] : '';
  });

  /**
   * Emoji selon pairing
   */
  readonly pairingEmoji = computed(() => {
    const p = this.pairing();
    const emojis: Record<PairingType, string> = {
      WHISKY: '🥃',
      RHUM: '🍹',
      COGNAC: '🥃',
      CAFE: '☕',
      THE: '🍵',
      EAU: '💧',
      VIN: '🍷',
      BIERE: '🍺',
      AUTRE: '🥂',
    };
    return p ? emojis[p] : '';
  });

  /**
   * Label selon pairing
   */
  readonly pairingLabel = computed(() => {
    const p = this.pairing();
    const labels: Record<PairingType, string> = {
      WHISKY: 'Whisky',
      RHUM: 'Rhum',
      COGNAC: 'Cognac',
      CAFE: 'Café',
      THE: 'Thé',
      EAU: 'Eau',
      VIN: 'Vin',
      BIERE: 'Bière',
      AUTRE: 'Autre',
    };
    return p ? labels[p] : '';
  });
}
