import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  DRAWS,
  ASH_NATURES,
  BALANCES,
  TERROIRS,
  STRENGTH_LABELS,
  VARIETY_LABELS,
  MOUTH_IMPRESSIONS,
  PERSISTENCES,
  type Draw,
  type AshNature,
  type Balance,
  type Terroir,
  type MouthImpression,
  type Persistence,
} from '@cigar-platform/shared/constants';

/**
 * Phase Conclusion Recap Component
 * Carte récap pour la phase Conclusion (expanded summary)
 *
 * ALL STARS Architecture ⭐
 * - Composant pure presentation
 * - Affiche les données techniques de conclusion
 */
@Component({
  selector: 'app-phase-conclusion-recap',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-4">
      <!-- Technique -->
      @if (draw() || ashNature() || balance() || terroir()) {
        <div class="flex flex-col gap-2">
          <span class="text-xs text-smoke-500 uppercase tracking-wide">Technique</span>
          <div class="flex flex-wrap gap-2">
            @if (draw()) {
              <span class="px-3 py-1 text-xs bg-gold-500/10 text-gold-500 rounded-full border border-gold-500/20">
                {{ getDrawLabel(draw()!) }}
              </span>
            }
            @if (ashNature()) {
              <span class="px-3 py-1 text-xs bg-gold-500/10 text-gold-500 rounded-full border border-gold-500/20">
                {{ getAshLabel(ashNature()!) }}
              </span>
            }
            @if (balance()) {
              <span class="px-3 py-1 text-xs bg-gold-500/10 text-gold-500 rounded-full border border-gold-500/20">
                {{ getBalanceLabel(balance()!) }}
              </span>
            }
            @if (terroir()) {
              <span class="px-3 py-1 text-xs bg-gold-500/10 text-gold-500 rounded-full border border-gold-500/20">
                {{ getTerroirLabel(terroir()!) }}
              </span>
            }
          </div>
        </div>
      }

      <!-- Corps -->
      @if (power() || variety()) {
        <div class="flex flex-col gap-2 pt-2 border-t border-zinc-800">
          <span class="text-xs text-smoke-500 uppercase tracking-wide">Corps</span>
          <div class="flex flex-wrap gap-2">
            @if (power()) {
              <span class="px-3 py-1 text-xs bg-gold-500/10 text-gold-500 rounded-full border border-gold-500/20">
                Puissance: {{ getPowerLabel(power()!) }}
              </span>
            }
            @if (variety()) {
              <span class="px-3 py-1 text-xs bg-gold-500/10 text-gold-500 rounded-full border border-gold-500/20">
                Variété: {{ getVarietyLabel(variety()!) }}
              </span>
            }
          </div>
        </div>
      }

      <!-- Impression finale -->
      @if ((mouthImpression() ?? []).length > 0 || persistence()) {
        <div class="flex flex-col gap-2 pt-2 border-t border-zinc-800">
          <span class="text-xs text-smoke-500 uppercase tracking-wide">Impression finale</span>
          <div class="flex flex-wrap gap-2">
            @for (imp of mouthImpression() ?? []; track imp) {
              <span class="px-3 py-1 text-xs bg-gold-500/10 text-gold-500 rounded-full border border-gold-500/20">
                {{ getImpressionLabel(imp) }}
              </span>
            }
            @if (persistence()) {
              <span class="px-3 py-1 text-xs bg-gold-500/10 text-gold-500 rounded-full border border-gold-500/20">
                {{ getPersistenceLabel(persistence()!) }}
              </span>
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class PhaseConclusionRecapComponent {
  // Inputs
  draw = input<Draw | null>(null);
  ashNature = input<AshNature | null>(null);
  balance = input<Balance | null>(null);
  terroir = input<Terroir | null>(null);
  power = input<number | null>(null);
  variety = input<number | null>(null);
  mouthImpression = input<MouthImpression[] | null>(null);
  persistence = input<Persistence | null>(null);

  // ==================== Label Helpers ====================

  getDrawLabel(id: Draw): string {
    return DRAWS.find((d) => d.id === id)?.label ?? id;
  }

  getAshLabel(id: AshNature): string {
    return ASH_NATURES.find((a) => a.id === id)?.label ?? id;
  }

  getBalanceLabel(id: Balance): string {
    return BALANCES.find((b) => b.id === id)?.label ?? id;
  }

  getTerroirLabel(id: Terroir): string {
    return TERROIRS.find((t) => t.id === id)?.label ?? id;
  }

  getPowerLabel(value: number): string {
    const label = STRENGTH_LABELS.find((l) => l.value === value);
    return label ? label.label : `${value}/10`;
  }

  getVarietyLabel(value: number): string {
    const label = VARIETY_LABELS.find((l) => l.value === value);
    return label ? label.label : `${value}/10`;
  }

  getImpressionLabel(id: MouthImpression): string {
    return MOUTH_IMPRESSIONS.find((i) => i.id === id)?.label ?? id;
  }

  getPersistenceLabel(id: Persistence): string {
    return PERSISTENCES.find((p) => p.id === id)?.label ?? id;
  }
}