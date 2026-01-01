import { Component, input, output, signal } from '@angular/core';
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
 * Phase Conclusion Component
 * Final technical assessment
 *
 * Captures:
 * - Draw quality
 * - Ash nature
 * - Balance
 * - Terroir
 * - Power (1-10 scale)
 * - Variety (1-10 scale)
 * - Mouth impression (multi-select)
 * - Persistence
 */
@Component({
  selector: 'app-phase-conclusion',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="phase-conclusion">
      <div class="phase-header">
        <h2>Conclusion</h2>
        <p class="phase-subtitle">Bilan technique de la dégustation</p>
      </div>

      <div class="phase-content">
        <!-- Technique Section -->
        <div class="section">
          <h3 class="section-title">Technique</h3>

          <!-- Draw -->
          <div class="form-group">
            <label>Tirage</label>
            <div class="chip-group">
              @for (draw of draws; track draw.id) {
                <button
                  type="button"
                  class="chip"
                  [class.chip-selected]="drawValue() === draw.id"
                  (click)="selectDraw(draw.id)"
                >
                  {{ draw.label }}
                </button>
              }
            </div>
          </div>

          <!-- Ash Nature -->
          <div class="form-group">
            <label>Nature de la cendre</label>
            <div class="chip-group">
              @for (ash of ashNatures; track ash.id) {
                <button
                  type="button"
                  class="chip"
                  [class.chip-selected]="ashValue() === ash.id"
                  (click)="selectAsh(ash.id)"
                >
                  {{ ash.label }}
                </button>
              }
            </div>
          </div>

          <!-- Balance -->
          <div class="form-group">
            <label>Équilibre</label>
            <div class="chip-group">
              @for (balance of balances; track balance.id) {
                <button
                  type="button"
                  class="chip"
                  [class.chip-selected]="balanceValue() === balance.id"
                  (click)="selectBalance(balance.id)"
                >
                  {{ balance.label }}
                </button>
              }
            </div>
          </div>

          <!-- Terroir -->
          <div class="form-group">
            <label>Terroir</label>
            <div class="chip-group">
              @for (terroir of terroirs; track terroir.id) {
                <button
                  type="button"
                  class="chip"
                  [class.chip-selected]="terroirValue() === terroir.id"
                  (click)="selectTerroir(terroir.id)"
                >
                  {{ terroir.label }}
                </button>
              }
            </div>
          </div>
        </div>

        <!-- Corps Section -->
        <div class="section">
          <h3 class="section-title">Corps</h3>

          <!-- Power -->
          <div class="form-group">
            <label>Puissance: {{ getPowerLabel(powerValue()) }}</label>
            <input
              type="range"
              min="1"
              max="10"
              [value]="powerValue()"
              (input)="setPower($any($event.target).value)"
              class="slider"
            />
          </div>

          <!-- Variety -->
          <div class="form-group">
            <label>Variété: {{ getVarietyLabel(varietyValue()) }}</label>
            <input
              type="range"
              min="1"
              max="10"
              [value]="varietyValue()"
              (input)="setVariety($any($event.target).value)"
              class="slider"
            />
          </div>
        </div>

        <!-- Impression Section -->
        <div class="section">
          <h3 class="section-title">Impression finale</h3>

          <!-- Mouth Impression (multi-select) -->
          <div class="form-group">
            <label>En bouche</label>
            <div class="chip-group">
              @for (impression of impressions; track impression.id) {
                <button
                  type="button"
                  class="chip"
                  [class.chip-selected]="isImpressionSelected(impression.id)"
                  (click)="toggleImpression(impression.id)"
                >
                  {{ impression.label }}
                </button>
              }
            </div>
          </div>

          <!-- Persistence -->
          <div class="form-group">
            <label>Persistance aromatique</label>
            <div class="chip-group">
              @for (persistence of persistences; track persistence.id) {
                <button
                  type="button"
                  class="chip"
                  [class.chip-selected]="persistenceValue() === persistence.id"
                  (click)="selectPersistence(persistence.id)"
                >
                  {{ persistence.label }}
                </button>
              }
            </div>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="phase-actions">
        <button class="btn btn-secondary" (click)="back.emit()">
          ← Retour
        </button>
        <button class="btn btn-primary" (click)="next.emit()">
          Continuer →
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .phase-conclusion {
        display: flex;
        flex-direction: column;
        gap: 2rem;
      }

      .phase-header {
        text-align: center;
      }

      .phase-header h2 {
        margin: 0 0 0.5rem;
        font-size: 1.5rem;
        font-weight: 600;
        color: var(--color-text-primary);
      }

      .phase-subtitle {
        margin: 0;
        font-size: 0.875rem;
        color: var(--color-text-secondary);
      }

      .phase-content {
        display: flex;
        flex-direction: column;
        gap: 2rem;
      }

      .section {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
      }

      .section-title {
        margin: 0;
        font-size: 1.125rem;
        font-weight: 600;
        color: var(--color-text-primary);
        padding-bottom: 0.5rem;
        border-bottom: 1px solid var(--color-border);
      }

      .form-group {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      .form-group label {
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--color-text-primary);
      }

      .chip-group {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
      }

      .chip {
        padding: 0.5rem 1rem;
        border: 1px solid var(--color-border);
        border-radius: 20px;
        background: var(--color-surface);
        color: var(--color-text-primary);
        font-size: 0.875rem;
        cursor: pointer;
        transition: all 0.2s;
      }

      .chip:hover {
        background: var(--color-hover);
      }

      .chip-selected {
        background: var(--color-primary);
        color: white;
        border-color: var(--color-primary);
      }

      .slider {
        width: 100%;
        height: 8px;
        border-radius: 4px;
        background: var(--color-border);
        outline: none;
        -webkit-appearance: none;
      }

      .slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: var(--color-primary);
        cursor: pointer;
      }

      .slider::-moz-range-thumb {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: var(--color-primary);
        cursor: pointer;
        border: none;
      }

      .phase-actions {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        padding-top: 1rem;
        border-top: 1px solid var(--color-border);
      }

      .btn {
        padding: 0.75rem 2rem;
        border: none;
        border-radius: 8px;
        font-size: 1rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
      }

      .btn-primary {
        background: var(--color-primary);
        color: white;
      }

      .btn-primary:hover {
        opacity: 0.9;
      }

      .btn-secondary {
        background: transparent;
        color: var(--color-text-primary);
        border: 1px solid var(--color-border);
      }

      .btn-secondary:hover {
        background: var(--color-hover);
      }
    `,
  ],
})
export class PhaseConclusionComponent {
  // Constants
  draws = DRAWS;
  ashNatures = ASH_NATURES;
  balances = BALANCES;
  terroirs = TERROIRS;
  powerLabels = STRENGTH_LABELS;
  varietyLabels = VARIETY_LABELS;
  impressions = MOUTH_IMPRESSIONS;
  persistences = PERSISTENCES;

  // Internal state
  drawValue = signal<Draw | null>(null);
  ashValue = signal<AshNature | null>(null);
  balanceValue = signal<Balance | null>(null);
  terroirValue = signal<Terroir | null>(null);
  powerValue = signal<number>(5);
  varietyValue = signal<number>(5);
  impressionsValue = signal<MouthImpression[]>([]);
  persistenceValue = signal<Persistence | null>(null);

  // Outputs
  back = output<void>();
  next = output<void>();
  dataChange = output<{
    draw: Draw | null;
    ashNature: AshNature | null;
    balance: Balance | null;
    terroir: Terroir | null;
    power: number;
    variety: number;
    mouthImpression: MouthImpression[];
    persistence: Persistence | null;
  }>();

  selectDraw(id: Draw): void {
    this.drawValue.set(id);
    this.emitChange();
  }

  selectAsh(id: AshNature): void {
    this.ashValue.set(id);
    this.emitChange();
  }

  selectBalance(id: Balance): void {
    this.balanceValue.set(id);
    this.emitChange();
  }

  selectTerroir(id: Terroir): void {
    this.terroirValue.set(id);
    this.emitChange();
  }

  setPower(value: string): void {
    this.powerValue.set(parseInt(value, 10));
    this.emitChange();
  }

  setVariety(value: string): void {
    this.varietyValue.set(parseInt(value, 10));
    this.emitChange();
  }

  isImpressionSelected(id: MouthImpression): boolean {
    return this.impressionsValue().includes(id);
  }

  toggleImpression(id: MouthImpression): void {
    const current = this.impressionsValue();
    const newValue = current.includes(id)
      ? current.filter((i) => i !== id)
      : [...current, id];
    this.impressionsValue.set(newValue);
    this.emitChange();
  }

  selectPersistence(id: Persistence): void {
    this.persistenceValue.set(id);
    this.emitChange();
  }

  getPowerLabel(value: number): string {
    const label = this.powerLabels.find((l) => l.value === value);
    return label ? label.label : '';
  }

  getVarietyLabel(value: number): string {
    const label = this.varietyLabels.find((l) => l.value === value);
    return label ? label.label : '';
  }

  private emitChange(): void {
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
