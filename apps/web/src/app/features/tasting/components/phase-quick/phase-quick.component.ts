import { Component, input, output, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  TASTING_MOMENTS,
  TASTING_SITUATIONS,
  PAIRING_TYPES,
  type TastingMoment,
  type TastingSituation,
  type PairingType,
} from '@cigar-platform/shared/constants';

/**
 * Phase Quick Component
 * Phase 1 of the Quick tasting flow
 *
 * Captures basic tasting context:
 * - Date (auto)
 * - Moment (morning/afternoon/evening)
 * - Situation (aperitif/cocktail/digestif)
 * - Pairing (whisky/rum/coffee/etc.)
 * - Pairing note (optional detail)
 * - Location (optional, solo only)
 * - Photo (optional)
 */
@Component({
  selector: 'app-phase-quick',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="phase-quick">
      <div class="phase-header">
        <h2>Contexte de dégustation</h2>
        <p class="phase-subtitle">Quelques informations sur ce moment</p>
      </div>

      <div class="phase-content">
        <!-- Date -->
        <div class="form-group">
          <label>Date</label>
          <input
            type="datetime-local"
            [(ngModel)]="dateValue"
            (ngModelChange)="handleDateChange()"
            class="form-control"
          />
        </div>

        <!-- Moment -->
        <div class="form-group">
          <label>Moment de la journée</label>
          <div class="chip-group">
            @for (moment of moments; track moment.id) {
              <button
                type="button"
                class="chip"
                [class.chip-selected]="momentValue() === moment.id"
                (click)="selectMoment(moment.id)"
              >
                {{ moment.label }}
              </button>
            }
          </div>
        </div>

        <!-- Situation -->
        <div class="form-group">
          <label>Situation</label>
          <div class="chip-group">
            @for (situation of situations; track situation.id) {
              <button
                type="button"
                class="chip"
                [class.chip-selected]="situationValue() === situation.id"
                (click)="selectSituation(situation.id)"
              >
                {{ situation.label }}
              </button>
            }
          </div>
        </div>

        <!-- Pairing -->
        <div class="form-group">
          <label>Accompagnement</label>
          <div class="chip-group">
            @for (pairing of pairings; track pairing.id) {
              <button
                type="button"
                class="chip"
                [class.chip-selected]="pairingValue() === pairing.id"
                (click)="selectPairing(pairing.id)"
              >
                {{ pairing.label }}
              </button>
            }
          </div>
        </div>

        <!-- Pairing Note (shown if pairing selected) -->
        @if (pairingValue()) {
          <div class="form-group">
            <label>Précisions (optionnel)</label>
            <input
              type="text"
              [(ngModel)]="pairingNoteValue"
              (ngModelChange)="handlePairingNoteChange()"
              placeholder="Ex: Lagavulin 16 ans"
              class="form-control"
            />
          </div>
        }

        <!-- Location (solo only - TODO: check context) -->
        <div class="form-group">
          <label>Lieu (optionnel)</label>
          <input
            type="text"
            [(ngModel)]="locationValue"
            (ngModelChange)="handleLocationChange()"
            placeholder="Ex: Terrasse, Bar Le Fumoir"
            class="form-control"
          />
        </div>

        <!-- Photo Upload (TODO: implement) -->
        <div class="form-group">
          <label>Photo (optionnel)</label>
          <button type="button" class="upload-btn" disabled>
            📸 Ajouter une photo
            <span class="badge-soon">Bientôt</span>
          </button>
        </div>
      </div>

      <!-- Actions -->
      <div class="phase-actions">
        <button class="btn btn-primary" (click)="next.emit()">
          Continuer →
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .phase-quick {
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
        gap: 1.5rem;
      }

      .form-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .form-group label {
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--color-text-primary);
      }

      .form-control {
        padding: 0.75rem;
        border: 1px solid var(--color-border);
        border-radius: 8px;
        font-size: 1rem;
        background: var(--color-surface);
        color: var(--color-text-primary);
      }

      .form-control:focus {
        outline: none;
        border-color: var(--color-primary);
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

      .upload-btn {
        position: relative;
        padding: 0.75rem;
        border: 1px dashed var(--color-border);
        border-radius: 8px;
        background: var(--color-surface);
        color: var(--color-text-secondary);
        font-size: 0.875rem;
        cursor: not-allowed;
        opacity: 0.6;
      }

      .badge-soon {
        position: absolute;
        top: -8px;
        right: -8px;
        padding: 0.25rem 0.5rem;
        background: var(--color-warning);
        color: white;
        font-size: 0.75rem;
        border-radius: 12px;
      }

      .phase-actions {
        display: flex;
        justify-content: flex-end;
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
    `,
  ],
})
export class PhaseQuickComponent implements OnInit {
  // Constants
  moments = TASTING_MOMENTS;
  situations = TASTING_SITUATIONS;
  pairings = PAIRING_TYPES;

  // Internal state
  dateValue = '';
  pairingNoteValue = '';
  locationValue = '';
  momentValue = signal<TastingMoment | null>(null);
  situationValue = signal<TastingSituation | null>(null);
  pairingValue = signal<PairingType | null>(null);

  // Outputs
  next = output<void>();
  dataChange = output<{
    date: string;
    moment: TastingMoment | null;
    situation: TastingSituation | null;
    pairing: PairingType | null;
    pairingNote: string;
    location: string;
  }>();

  ngOnInit(): void {
    // Initialize date to now
    const now = new Date();
    this.dateValue = this.formatDateTimeLocal(now);
  }

  selectMoment(moment: TastingMoment): void {
    this.momentValue.set(moment);
    this.emitChange();
  }

  selectSituation(situation: TastingSituation): void {
    this.situationValue.set(situation);
    this.emitChange();
  }

  selectPairing(pairing: PairingType): void {
    this.pairingValue.set(pairing);
    this.emitChange();
  }

  handleDateChange(): void {
    this.emitChange();
  }

  handlePairingNoteChange(): void {
    this.emitChange();
  }

  handleLocationChange(): void {
    this.emitChange();
  }

  private emitChange(): void {
    this.dataChange.emit({
      date: this.dateValue,
      moment: this.momentValue(),
      situation: this.situationValue(),
      pairing: this.pairingValue(),
      pairingNote: this.pairingNoteValue,
      location: this.locationValue,
    });
  }

  private formatDateTimeLocal(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }
}
