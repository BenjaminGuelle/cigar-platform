import { Component, output, signal, input, effect, computed } from '@angular/core';
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
} from '@cigar-platform/shared/constants';
import { SingleSelectChipsComponent, type SingleSelectOption } from '../shared/single-select-chips/single-select-chips.component';
import { IconDirective, ButtonComponent } from '@cigar-platform/shared/ui';

/**
 * Phase Conclusion Component (Chat-Like)
 * "Conclusion" - Bilan technique final de la dégustation
 *
 * ALL STARS Architecture ⭐
 * - Chat-like sequential flow
 * - One section at a time
 * - Header recap progressif
 *
 * Flow: Technique → Corps → Impression → Done
 */

type ConclusionStep = 'technique' | 'corps' | 'impression' | 'done';

@Component({
  selector: 'app-phase-conclusion',
  standalone: true,
  imports: [CommonModule, SingleSelectChipsComponent, IconDirective, ButtonComponent],
  templateUrl: './phase-conclusion.component.html',
  styles: [`
    .question-step {
      animation: question-enter 0.25s ease-out;
    }
    @keyframes question-enter {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .header-summary {
      animation: header-update 0.3s ease-out;
    }
    @keyframes header-update {
      from { opacity: 0.7; }
      to { opacity: 1; }
    }
    input[type="range"] {
      -webkit-appearance: none;
      appearance: none;
      background: transparent;
    }
    input[type="range"]::-webkit-slider-runnable-track {
      height: 8px;
      border-radius: 4px;
      background: linear-gradient(to right, rgb(212 175 55), rgb(212 175 55 / 0.2));
    }
    input[type="range"]::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: rgb(212 175 55);
      cursor: pointer;
      margin-top: -6px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    }
    input[type="range"]::-moz-range-track {
      height: 8px;
      border-radius: 4px;
      background: linear-gradient(to right, rgb(212 175 55), rgb(212 175 55 / 0.2));
    }
    input[type="range"]::-moz-range-thumb {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: rgb(212 175 55);
      cursor: pointer;
      border: none;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    }
  `],
})
export class PhaseConclusionComponent {
  // Constants
  readonly draws = DRAWS;
  readonly ashNatures = ASH_NATURES;
  readonly balances = BALANCES;
  readonly terroirs = TERROIRS;
  readonly powerLabels = STRENGTH_LABELS;
  readonly varietyLabels = VARIETY_LABELS;
  readonly impressions = MOUTH_IMPRESSIONS;
  readonly persistences = PERSISTENCES;

  // Restoration inputs
  initialDraw = input<string | null | undefined>();
  initialAsh = input<string | null | undefined>();
  initialBalance = input<string | null | undefined>();
  initialTerroir = input<string | null | undefined>();
  initialPower = input<number | null | undefined>();
  initialVariety = input<number | null | undefined>();
  initialImpressions = input<string[] | null | undefined>();
  initialPersistence = input<string | null | undefined>();

  // State
  currentStep = signal<ConclusionStep>('technique');
  drawValue = signal<string | null>(null);
  ashValue = signal<string | null>(null);
  balanceValue = signal<string | null>(null);
  terroirValue = signal<string | null>(null);
  powerValue = signal<number>(5);
  varietyValue = signal<number>(5);
  impressionsValue = signal<string[]>([]);
  persistenceValue = signal<string | null>(null);

  // Options pour SingleSelectChips
  readonly drawOptions = computed<SingleSelectOption[]>(() =>
    this.draws.map(d => ({ id: d.id, label: d.label }))
  );
  readonly ashOptions = computed<SingleSelectOption[]>(() =>
    this.ashNatures.map(a => ({ id: a.id, label: a.label }))
  );
  readonly balanceOptions = computed<SingleSelectOption[]>(() =>
    this.balances.map(b => ({ id: b.id, label: b.label }))
  );
  readonly terroirOptions = computed<SingleSelectOption[]>(() =>
    this.terroirs.map(t => ({ id: t.id, label: t.label }))
  );
  readonly persistenceOptions = computed<SingleSelectOption[]>(() =>
    this.persistences.map(p => ({ id: p.id, label: p.label }))
  );

  #hasRestored = false;

  // Outputs
  dataChange = output<{
    draw: string | null;
    ashNature: string | null;
    balance: string | null;
    terroir: string | null;
    power: number;
    variety: number;
    mouthImpression: string[];
    persistence: string | null;
  }>();
  done = output<void>();

  constructor() {
    effect(() => {
      if (this.#hasRestored) return;

      const draw = this.initialDraw();
      const ash = this.initialAsh();
      const balance = this.initialBalance();
      const terroir = this.initialTerroir();
      const power = this.initialPower();
      const variety = this.initialVariety();
      const impressions = this.initialImpressions();
      const persistence = this.initialPersistence();

      const hasTechnique = draw && ash && balance && terroir;
      const hasImpression = (impressions && impressions.length > 0) && persistence;

      if (!hasTechnique && !hasImpression) return;

      this.#hasRestored = true;

      if (draw) this.drawValue.set(draw);
      if (ash) this.ashValue.set(ash);
      if (balance) this.balanceValue.set(balance);
      if (terroir) this.terroirValue.set(terroir);
      if (power !== null && power !== undefined) this.powerValue.set(power);
      if (variety !== null && variety !== undefined) this.varietyValue.set(variety);
      if (impressions && impressions.length > 0) this.impressionsValue.set(impressions);
      if (persistence) this.persistenceValue.set(persistence);

      if (hasTechnique && hasImpression) {
        this.currentStep.set('done');
        this.done.emit();
      } else if (hasTechnique) {
        this.currentStep.set('impression');
      }
    });
  }

  // Step 1: Technique
  selectDraw(id: string): void { this.drawValue.set(id); this.emitData(); }
  selectAsh(id: string): void { this.ashValue.set(id); this.emitData(); }
  selectBalance(id: string): void { this.balanceValue.set(id); this.emitData(); }
  selectTerroir(id: string): void { this.terroirValue.set(id); this.emitData(); }
  isTechniqueValid(): boolean {
    return !!(this.drawValue() && this.ashValue() && this.balanceValue() && this.terroirValue());
  }
  goToCorps(): void { this.currentStep.set('corps'); }

  // Step 2: Corps
  onPowerInput(event: Event): void {
    this.powerValue.set(parseInt((event.target as HTMLInputElement).value, 10));
    this.emitData();
  }
  onVarietyInput(event: Event): void {
    this.varietyValue.set(parseInt((event.target as HTMLInputElement).value, 10));
    this.emitData();
  }
  goToImpression(): void { this.currentStep.set('impression'); }

  // Step 3: Impression
  isImpressionSelected(id: string): boolean { return this.impressionsValue().includes(id); }
  toggleImpression(id: string): void {
    const current = this.impressionsValue();
    this.impressionsValue.set(current.includes(id) ? current.filter(i => i !== id) : [...current, id]);
    this.emitData();
  }
  selectPersistence(id: string): void { this.persistenceValue.set(id); this.emitData(); }
  isImpressionValid(): boolean { return this.impressionsValue().length > 0 && !!this.persistenceValue(); }
  goToDone(): void { this.currentStep.set('done'); this.done.emit(); }

  // Label Helpers
  getDrawLabel(id: string): string { return this.draws.find(d => d.id === id)?.label ?? id; }
  getAshLabel(id: string): string { return this.ashNatures.find(a => a.id === id)?.label ?? id; }
  getBalanceLabel(id: string): string { return this.balances.find(b => b.id === id)?.label ?? id; }
  getTerroirLabel(id: string): string { return this.terroirs.find(t => t.id === id)?.label ?? id; }
  getPowerLabel(value: number): string { return this.powerLabels.find(l => l.value === value)?.label ?? ''; }
  getVarietyLabel(value: number): string { return this.varietyLabels.find(l => l.value === value)?.label ?? ''; }
  getImpressionLabel(id: string): string { return this.impressions.find(i => i.id === id)?.label ?? id; }
  getPersistenceLabel(id: string): string { return this.persistences.find(p => p.id === id)?.label ?? id; }

  private emitData(): void {
    this.dataChange.emit({
      draw: this.drawValue(),
      ashNature: this.ashValue(),
      balance: this.balanceValue(),
      terroir: this.terroirValue(),
      power: this.powerValue(),
      variety: this.varietyValue(),
      mouthImpression: this.impressionsValue(),
      persistence: this.persistenceValue(),
    });
  }
}
