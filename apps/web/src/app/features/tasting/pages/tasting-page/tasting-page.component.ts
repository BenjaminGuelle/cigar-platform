import {
  Component,
  OnInit,
  signal,
  computed,
  effect,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { injectTastingStore } from '../../../../core/stores/tasting.store';
import { PhaseQuickComponent } from '../../components/phase-quick/phase-quick.component';
import { PhaseFinaleComponent } from '../../components/phase-finale/phase-finale.component';
import { ConfirmationModalComponent } from '../../components/confirmation-modal/confirmation-modal.component';
import type {
  CreateTastingDto,
  UpdateTastingDto,
  CompleteTastingDto,
} from '@cigar-platform/types';

/**
 * Tasting Page Component
 * Full-screen mode focus experience for cigar tasting
 *
 * Flow (Quick Mode):
 * Phase 1 (Quick) → Phase Finale → Confirmation
 *
 * Features:
 * - Auto-save DRAFT on every change
 * - Minimal header with back button
 * - No bottom tab (mode focus)
 * - Confirmation on exit if not completed
 */
@Component({
  selector: 'app-tasting-page',
  standalone: true,
  imports: [
    CommonModule,
    PhaseQuickComponent,
    PhaseFinaleComponent,
    ConfirmationModalComponent,
  ],
  template: `
    <div class="tasting-page">
      <!-- Minimal Header -->
      <header class="tasting-header">
        <button class="back-btn" (click)="handleBack()">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M15 18l-6-6 6-6"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
        <h1 class="title">
          {{ isNew() ? 'Nouvelle dégustation' : 'Dégustation' }}
        </h1>
        <div class="header-actions">
          @if (currentPhase() !== 'confirmation') {
            <span class="save-indicator">
              {{ saveStatus() }}
            </span>
          }
        </div>
      </header>

      <!-- Content -->
      <main class="tasting-content">
        @switch (currentPhase()) {
          @case ('quick') {
            <div class="phase-container">
              <app-phase-quick
                (next)="goToFinale()"
                (dataChange)="handleQuickDataChange($event)"
              />
            </div>
          }
          @case ('finale') {
            <div class="phase-container">
              <app-phase-finale
                (back)="goToQuick()"
                (complete)="completeTasting()"
                (dataChange)="handleFinaleDataChange($event)"
              />
            </div>
          }
        }

        <!-- Confirmation Modal (overlay) -->
        @if (currentPhase() === 'confirmation') {
          <app-confirmation-modal
            (viewTasting)="viewTasting()"
            (close)="close()"
          />
        }
      </main>
    </div>
  `,
  styles: [
    `
      .tasting-page {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: var(--color-background);
        z-index: 1000;
        display: flex;
        flex-direction: column;
      }

      .tasting-header {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1rem;
        border-bottom: 1px solid var(--color-border);
        background: var(--color-surface);
      }

      .back-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        border: none;
        background: transparent;
        color: var(--color-text-primary);
        cursor: pointer;
        border-radius: 8px;
        transition: background 0.2s;
      }

      .back-btn:hover {
        background: var(--color-hover);
      }

      .title {
        flex: 1;
        margin: 0;
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--color-text-primary);
      }

      .header-actions {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .save-indicator {
        font-size: 0.875rem;
        color: var(--color-text-secondary);
      }

      .tasting-content {
        flex: 1;
        overflow-y: auto;
        padding: 1.5rem;
      }

      .phase-container {
        max-width: 600px;
        margin: 0 auto;
      }
    `,
  ],
})
export class TastingPageComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private tastingStore = injectTastingStore();

  // Route params
  private tastingIdParam = signal<string | null>(null);

  // Tasting data
  tasting = this.tastingStore.getTastingById(() => this.tastingIdParam() ?? '');

  // UI state
  currentPhase = signal<'quick' | 'finale' | 'confirmation'>('quick');
  saveStatus = signal<string>('');
  isNew = computed(() => !this.tastingIdParam());

  // Tasting data (temporary until store integration)
  private quickData = signal<any>(null);
  private finaleData = signal<any>(null);

  ngOnInit(): void {
    // Get tasting ID from route params
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.tastingIdParam.set(id);
    }

    // TODO: Create draft tasting if new
    // TODO: Load existing tasting if ID provided
  }

  handleQuickDataChange(data: any): void {
    this.quickData.set(data);
    // TODO: Auto-save to draft tasting
    this.saveStatus.set('Sauvegardé');
  }

  handleFinaleDataChange(data: any): void {
    this.finaleData.set(data);
    // TODO: Auto-save to draft tasting
    this.saveStatus.set('Sauvegardé');
  }

  goToQuick(): void {
    this.currentPhase.set('quick');
  }

  goToFinale(): void {
    this.currentPhase.set('finale');
  }

  async completeTasting(): Promise<void> {
    const finale = this.finaleData();
    if (!finale || finale.rating === 0) {
      alert('Veuillez donner une note avant de terminer');
      return;
    }

    // TODO: Call completeTasting mutation
    // For now, just show confirmation
    this.saveStatus.set('Terminé');
    this.currentPhase.set('confirmation');
  }

  viewTasting(): void {
    const id = this.tastingIdParam();
    if (id) {
      // TODO: Navigate to tasting detail view
      this.router.navigate(['/tasting', id]);
    } else {
      this.close();
    }
  }

  close(): void {
    this.router.navigate(['/dashboard']);
  }

  handleBack(): void {
    const phase = this.currentPhase();

    if (phase === 'confirmation') {
      this.close();
      return;
    }

    if (phase === 'finale') {
      this.currentPhase.set('quick');
      return;
    }

    // Phase quick: confirm exit if draft not completed
    if (
      confirm(
        'Voulez-vous vraiment quitter ? Votre dégustation sera sauvegardée en brouillon.'
      )
    ) {
      this.router.navigate(['/dashboard']);
    }
  }
}
