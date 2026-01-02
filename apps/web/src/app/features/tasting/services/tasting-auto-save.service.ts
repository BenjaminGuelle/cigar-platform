import { Injectable, signal, inject, OnDestroy } from '@angular/core';
import { injectTastingStore } from '../../../core/stores/tasting.store';
import { injectObservationStore } from '../../../core/stores/observation.store';
import type { UpdateTastingDto, UpsertObservationDto } from '@cigar-platform/types';

/**
 * Tasting Auto-Save Service
 * Gestion centralisée de l'auto-save avec debounce
 *
 * ALL STARS Architecture ⭐
 * - Single Responsibility: Auto-save only
 * - Debounced (2s) pour éviter trop d'appels API
 * - Cleanup automatique des timers
 * - Support multi-sources (tasting data + observations)
 *
 * Features:
 * - Save tasting data (quick/finale)
 * - Save observations (presentation, cold draw, etc.)
 * - Status tracking (Sauvegarde... → Sauvegardé)
 * - Skip save en Discovery mode
 *
 * @example
 * ```typescript
 * const autoSave = inject(TastingAutoSaveService);
 *
 * // Initialize with tasting ID
 * autoSave.setTastingId(tastingId);
 *
 * // Save tasting data (debounced 2s)
 * autoSave.saveTastingData({
 *   moment: 'AFTER_MEAL',
 *   situation: 'OUTDOOR',
 * });
 *
 * // Save observation (debounced 2s)
 * autoSave.saveObservation('presentation', {
 *   organoleptic: { ... }
 * });
 * ```
 */
@Injectable()
export class TastingAutoSaveService implements OnDestroy {
  private tastingStore = injectTastingStore();
  private observationStore = injectObservationStore();

  // Tasting ID
  private tastingId = signal<string | null>(null);

  // Save status
  readonly saveStatus = signal<string>('');

  // Debounce timers
  private tastingDataTimer: ReturnType<typeof setTimeout> | null = null;
  private observationTimer: ReturnType<typeof setTimeout> | null = null;

  // Pending data
  private pendingTastingData: UpdateTastingDto | null = null;
  private pendingObservation: {
    phase: string;
    data: UpsertObservationDto;
  } | null = null;

  /**
   * Set tasting ID
   */
  setTastingId(id: string | null): void {
    this.tastingId.set(id);
  }

  /**
   * Save tasting data (debounced 2s)
   * Accumule les changements et save après 2s d'inactivité
   */
  saveTastingData(data: UpdateTastingDto): void {
    this.pendingTastingData = { ...this.pendingTastingData, ...data };

    if (this.tastingDataTimer) {
      clearTimeout(this.tastingDataTimer);
    }

    this.saveStatus.set('Sauvegarde...');

    this.tastingDataTimer = setTimeout(() => {
      void this.flushTastingData();
    }, 2000);
  }

  /**
   * Save observation (debounced 2s)
   *
   * @param phase - Phase ID (presentation, cold_draw, etc.)
   * @param data - Observation data
   * @param skipSave - Skip save (Discovery mode)
   */
  saveObservation(
    phase: string,
    data: UpsertObservationDto,
    skipSave = false
  ): void {
    if (skipSave) {
      // Discovery mode - don't save
      return;
    }

    this.pendingObservation = { phase, data };

    if (this.observationTimer) {
      clearTimeout(this.observationTimer);
    }

    this.saveStatus.set('Sauvegarde...');

    this.observationTimer = setTimeout(() => {
      void this.flushObservation();
    }, 2000);
  }

  /**
   * Flush tasting data to store
   */
  private async flushTastingData(): Promise<void> {
    const tastingId = this.tastingId();
    if (!tastingId || !this.pendingTastingData) return;

    const data = this.pendingTastingData;
    this.pendingTastingData = null;

    try {
      // Only save if there's actual data
      if (Object.keys(data).length > 0) {
        await this.tastingStore.updateTasting.mutate({
          id: tastingId,
          data,
        });
      }

      this.showSavedStatus();
    } catch (error) {
      this.saveStatus.set('Erreur');
      console.error('[TastingAutoSave] Error saving tasting data:', error);
    }
  }

  /**
   * Flush observation to store
   */
  private async flushObservation(): Promise<void> {
    const tastingId = this.tastingId();
    if (!tastingId || !this.pendingObservation) return;

    const { phase, data } = this.pendingObservation;
    this.pendingObservation = null;

    try {
      await this.observationStore.upsertObservation.mutate({
        tastingId,
        phase,
        data,
      });

      this.showSavedStatus();
    } catch (error) {
      this.saveStatus.set('Erreur');
      console.error('[TastingAutoSave] Error saving observation:', error);
    }
  }

  /**
   * Show "Sauvegardé" status for 2s
   */
  private showSavedStatus(): void {
    this.saveStatus.set('Sauvegardé');

    setTimeout(() => {
      if (this.saveStatus() === 'Sauvegardé') {
        this.saveStatus.set('');
      }
    }, 2000);
  }

  /**
   * Force flush all pending saves (when leaving component)
   */
  async flush(): Promise<void> {
    const promises: Promise<void>[] = [];

    if (this.pendingTastingData) {
      promises.push(this.flushTastingData());
    }

    if (this.pendingObservation) {
      promises.push(this.flushObservation());
    }

    await Promise.all(promises);
  }

  /**
   * Cleanup timers on destroy
   */
  ngOnDestroy(): void {
    if (this.tastingDataTimer) {
      clearTimeout(this.tastingDataTimer);
    }

    if (this.observationTimer) {
      clearTimeout(this.observationTimer);
    }
  }
}