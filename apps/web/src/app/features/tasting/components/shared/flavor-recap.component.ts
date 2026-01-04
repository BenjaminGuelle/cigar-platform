import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { FlavorTag } from '../../models/tasting-state.model';

/**
 * Flavor Recap Component
 * Carte récap réutilisable pour afficher goûts et arômes
 *
 * ALL STARS Architecture ⭐
 * - Composant pure presentation
 * - Réutilisé pour Cold Draw et les 3 Tercios
 * - Style cohérent avec les autres recaps
 */
@Component({
  selector: 'app-flavor-recap',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="w-full bg-zinc-900/50 rounded-xl border border-zinc-800 p-4 space-y-4">
      <!-- Tastes -->
      @if (tastes() && tastes()!.length > 0) {
        <div class="flex flex-col gap-2">
          <span class="text-xs text-smoke-500 uppercase tracking-wide">
            Goûts ({{ tastes()!.length }})
          </span>
          <div class="flex flex-wrap gap-2">
            @for (taste of tastes(); track taste.id) {
              <span class="px-3 py-1 text-xs bg-gold-500/10 text-gold-500 rounded-full border border-gold-500/20">
                {{ taste.id }} ({{ taste.intensity }}/3)
              </span>
            }
          </div>
        </div>
      }

      <!-- Aromas -->
      @if (aromas() && aromas()!.length > 0) {
        <div class="flex flex-col gap-2 pt-2 border-t border-zinc-800">
          <span class="text-xs text-smoke-500 uppercase tracking-wide">
            Arômes ({{ aromas()!.length }})
          </span>
          <div class="flex flex-wrap gap-2">
            @for (aroma of aromas(); track aroma.id) {
              <span class="px-3 py-1 text-xs bg-gold-500/10 text-gold-500 rounded-full border border-gold-500/20">
                {{ aroma.id }} ({{ aroma.intensity }}/3)
              </span>
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class FlavorRecapComponent {
  tastes = input<FlavorTag[] | null>(null);
  aromas = input<FlavorTag[] | null>(null);
}
