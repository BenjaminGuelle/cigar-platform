import { Injectable, inject, signal, computed, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { injectTastingStore } from '../../../core/stores/tasting.store';
import { ContextStore } from '../../../core/stores/context.store';
import { PremiumAccessService } from '../../../core/services/premium-access.service';
import { ToastService } from '../../../core/services/toast.service';
import { TastingAutoSaveService } from './tasting-auto-save.service';
import { TastingScrollService } from './tasting-scroll.service';
import { TastingFormService } from './tasting-form.service';
import { TastingsService } from '@cigar-platform/types/lib/tastings/tastings.service';
import type {
  CreateTastingDto,
  UpdateTastingDto,
  CompleteTastingDto,
  TastingResponseDto,
} from '@cigar-platform/types';

/**
 * Tasting Phase Union Type
 */
export type TastingPhase = 'quick' | 'presentation' | 'cold_draw' | 'first_third' | 'second_third' | 'final_third' | 'conclusion' | 'finale' | 'confirmation';

/**
 * Flow Mode
 */
export type FlowMode = 'quick' | 'chronique' | null;

/**
 * Tasting Orchestrator Service
 * Gestion centralisée du cycle de vie et du flow de la feature Tasting
 *
 * ALL STARS Architecture ⭐
 * - Single Source of Truth pour tout l'état du tasting
 * - Gestion du contexte (Solo/Club/Event)
 * - Auto-complete intelligent
 * - Coordination Flow Premium/Free/Discovery
 * - Séparation des responsabilités (délègue à AutoSave, Scroll, Premium)
 *
 * Responsabilités:
 * 1. Cycle de vie (create, load, complete, delete)
 * 2. Gestion du contexte (Solo/Club/Event avec auto-complete)
 * 3. Flow management (Quick/Chronique/Discovery)
 * 4. État central (Signals)
 * 5. Coordination (AutoSave + Scroll + Premium)
 *
 * @example
 * ```typescript
 * orchestrator = inject(TastingOrchestratorService);
 *
 * // Initialize (context-aware)
 * await orchestrator.createOrLoadDraft(cigarId, eventId);
 *
 * // CTAs
 * orchestrator.handleCtaA_Verdict();
 * orchestrator.handleCtaB_Chronique();
 *
 * // Complete
 * await orchestrator.completeTasting();
 * ```
 */
@Injectable()
export class TastingOrchestratorService implements OnDestroy {
  // Services
  readonly #router = inject(Router);
  readonly #tastingStore = injectTastingStore();
  readonly #tastingsService = inject(TastingsService);
  readonly #contextStore = inject(ContextStore);
  readonly #premiumAccess = inject(PremiumAccessService);
  readonly #toast = inject(ToastService);
  readonly #autoSave = inject(TastingAutoSaveService);
  readonly #scroll = inject(TastingScrollService);
  readonly #formService = inject(TastingFormService);

  // ==================== État Central ====================

  // Tasting state
  readonly tastingId = signal<string | null>(null);
  readonly cigarId = signal<string | null>(null);
  readonly eventId = signal<string | null>(null);
  readonly startTime = Date.now();

  // Timer dynamique (mis à jour toutes les secondes)
  readonly #currentTime = signal(Date.now());
  #timerInterval: ReturnType<typeof setInterval> | null = null;

  // Phase management
  readonly currentPhase = signal<TastingPhase>('quick');
  readonly flowMode = signal<FlowMode>(null);
  readonly isDiscoveryMode = signal(false);
  readonly revealedPhases = signal<Set<TastingPhase>>(new Set(['quick', 'finale'])); // Quick et Finale toujours visibles

  // Data
  readonly finaleData = signal<{ rating: number; comment: string } | null>(null);
  readonly showConfirmation = signal(false);
  readonly showDiscoveryBottomSheet = signal(false);
  readonly showDraftConfirmation = signal(false);
  readonly showExitConfirmation = signal(false);
  readonly existingDraft = signal<TastingResponseDto | null>(null);
  readonly isCompleting = signal(false);

  // Cigar confirmé pour restoration (seulement après clic sur "Continuer")
  readonly confirmedDraftCigar = signal<any>(null);

  // ==================== Computed ====================

  /**
   * Cigar from existing draft (for draft restoration)
   * NOTE: This is only for internal use, use confirmedDraftCigar for component input
   */
  readonly draftCigar = computed(() => {
    const draft = this.existingDraft();
    return draft?.cigar ?? null;
  });

  /**
   * Phase 1 complétée ? (validation simplifiée pour MVP)
   */
  readonly isPhase1Completed = computed(() => {
    // TODO: Validation réelle (moment, situation, pairing)
    return true;
  });

  /**
   * Peut compléter le tasting ?
   * Uses reactive ratingSignal from FormService
   */
  readonly canComplete = computed(() => {
    const rating = this.#formService.ratingSignal();
    return rating > 0;
  });

  /**
   * Elapsed time (format MM:SS)
   * Timer dynamique qui se met à jour toutes les secondes
   */
  readonly elapsedTime = computed(() => {
    const elapsed = Math.floor((this.#currentTime() - this.startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  });

  /**
   * Label de la phase courante
   */
  readonly currentPhaseLabel = computed(() => {
    const labels: Record<TastingPhase, string> = {
      quick: 'L\'Entrée en Matière',
      presentation: 'Présentation',
      cold_draw: 'Fumage à cru',
      first_third: 'L\'Éveil',
      second_third: 'La Plénitude',
      final_third: 'L\'Intensité',
      conclusion: 'Conclusion',
      finale: 'Le Dernier Mot',
      confirmation: 'Confirmation',
    };
    return labels[this.currentPhase()];
  });

  /**
   * Les phases sont-elles révélées dans le DOM ?
   */
  isPhaseRevealed(phase: TastingPhase): boolean {
    return this.revealedPhases().has(phase);
  }

  // ==================== Constructor ====================

  constructor() {
    // Démarrer le timer dynamique (mise à jour toutes les secondes)
    this.#timerInterval = setInterval(() => {
      this.#currentTime.set(Date.now());
    }, 1000);
  }

  // ==================== Cycle de Vie ====================

  /**
   * Créer ou charger un draft (context-aware)
   *
   * Pattern: Auto-complete intelligent selon le contexte + Détection de draft existant
   * - Solo → location: 'Chez moi' (éditable), eventId: null, sharedClubs: []
   * - Club → location: club.name (éditable), eventId: null, sharedClubs: [clubId]
   * - Event → location: event.location (éditable), eventId: event.id, sharedClubs: [clubId]
   *
   * Flow Draft Detection:
   * 1. Si ID en URL → Charger ce tasting
   * 2. Sinon, chercher drafts existants
   * 3. Si 1 draft trouvé → Afficher modal de confirmation
   * 4. Si aucun draft → Créer nouveau
   *
   * @param cigarId - Cigar ID (optionnel, peut être sélectionné dans Phase Quick)
   * @param eventId - Event ID (optionnel, contexte Event)
   */
  async createOrLoadDraft(cigarId?: string | null, eventId?: string | null): Promise<void> {
    // Si on a un ID dans l'URL (édition), charger
    if (this.tastingId()) {
      this.#autoSave.setTastingId(this.tastingId());
      return;
    }

    // Chercher les drafts existants pour ce cigare (ou tous si pas de cigarId)
    try {
      // Call API directly to get fresh draft data
      // IMPORTANT: Only include cigarId if it's a valid string (not null/undefined)
      const params: any = {
        limit: 100,
        page: 1,
        status: 'DRAFT',
        sortBy: 'date',
        order: 'desc',
      };

      // Only add cigarId if it's a valid string
      if (cigarId && cigarId !== 'null' && cigarId !== 'undefined') {
        params.cigarId = cigarId;
      }

      const response = await this.#tastingsService.tastingControllerFindMine(params);

      const existingDrafts = response?.data ?? [];

      // Si un draft existe, afficher la modal de confirmation
      if (existingDrafts.length > 0) {
        const draft = existingDrafts[0]; // Prendre le plus récent
        this.existingDraft.set(draft);
        this.showDraftConfirmation.set(true);
        // La suite du flow sera gérée par les handlers de la modal
        return;
      }

      // Aucun draft existant → Créer un nouveau SEULEMENT si cigarId est fourni
      // Sinon, attendre que l'utilisateur sélectionne un cigare dans Phase Quick
      if (cigarId && cigarId !== 'null' && cigarId !== 'undefined') {
        await this.#createNewDraft(cigarId, eventId);
      } else {
        // Pas de cigarId → L'utilisateur sélectionnera le cigare dans Phase Quick
        // Le tasting sera créé automatiquement lors de la première sauvegarde
        this.cigarId.set(null);
        this.eventId.set(eventId || null);
        this.#autoSave.saveStatus.set('');
      }
    } catch (error) {
      this.#autoSave.saveStatus.set('Erreur');
      throw error;
    }
  }

  /**
   * Continuer le draft existant (depuis la modal)
   */
  async continueDraft(): Promise<void> {
    const draft = this.existingDraft();
    if (!draft) return;

    this.showDraftConfirmation.set(false);

    // Charger le draft existant
    this.tastingId.set(draft.id);
    this.cigarId.set(draft.cigarId);
    this.eventId.set(draft.eventId || null);

    // Confirmer le cigar pour restoration (déclenche l'effect dans PhaseQuickComponent)
    if (draft.cigar) {
      this.confirmedDraftCigar.set(draft.cigar);
    }

    // Restaurer les données dans les FormGroups
    // Phase Quick
    this.#formService.patchQuickData({
      situation: draft.situation ?? null,
      pairing: draft.pairing ?? null,
      pairingNote: draft.pairingNote || '',
    });

    // Cigar is restored via the initialCigar input in PhaseQuickComponent
    this.cigarId.set(draft.cigarId);

    // Phase Finale
    if (draft.rating && draft.rating > 0) {
      this.#formService.patchFinaleData({
        rating: draft.rating,
        comment: draft.comment || '',
      });

      // Aussi mettre à jour le signal pour la logique existante
      this.finaleData.set({
        rating: draft.rating,
        comment: draft.comment || '',
      });
    }

    // Configure auto-save
    this.#autoSave.setTastingId(draft.id);
    this.#toast.info('Reprise du rituel précédent...');
  }

  /**
   * Créer un nouveau tasting et supprimer le draft existant
   */
  async createNewAndDeleteDraft(cigarId?: string | null, eventId?: string | null): Promise<void> {
    const draft = this.existingDraft();
    this.showDraftConfirmation.set(false);

    // Clear confirmed draft cigar (pour ne pas pré-remplir)
    this.confirmedDraftCigar.set(null);
    this.existingDraft.set(null);

    // Supprimer le draft existant
    if (draft) {
      try {
        await this.#tastingStore.deleteTasting.mutate(draft.id);
      } catch (error) {
        console.error('Error deleting draft:', error);
      }
    }

    // Créer un nouveau draft SEULEMENT si cigarId est fourni
    if (cigarId && cigarId !== 'null' && cigarId !== 'undefined') {
      await this.#createNewDraft(cigarId, eventId);
    } else {
      // Pas de cigarId → attendre la sélection dans Phase Quick
      this.cigarId.set(null);
      this.eventId.set(eventId || null);
      this.#autoSave.saveStatus.set('');
    }
  }

  /**
   * Créer un nouveau draft (méthode privée)
   * IMPORTANT: cigarId est REQUIS - ne doit être appelé qu'avec un cigarId valide
   */
  async #createNewDraft(cigarId: string, eventId?: string | null): Promise<void> {
    this.#autoSave.saveStatus.set('Création...');

    // Préparer les données avec auto-complete contextuel
    const context = this.#contextStore.context();
    const createDto: CreateTastingDto = {
      cigarId, // Required field
      eventId: eventId && eventId !== 'null' && eventId !== 'undefined' ? eventId : undefined,
    };

    // Auto-complete location selon contexte
    let defaultLocation = 'Chez moi'; // Solo par défaut
    if (context.type === 'club' && context.club) {
      defaultLocation = context.club.name;
    }

    const result = await this.#tastingStore.createTasting.mutate(createDto);

    if (result) {
      this.tastingId.set(result.id);
      this.cigarId.set(cigarId || null);
      this.eventId.set(eventId || null);
      this.#autoSave.setTastingId(result.id);

      // Set confirmedDraftCigar pour pré-remplir l'input (même pattern que continueDraft)
      if (result.cigar) {
        this.confirmedDraftCigar.set(result.cigar);
      }

      // Auto-save initial location
      this.#autoSave.saveTastingData({
        location: defaultLocation,
      });

      this.#autoSave.saveStatus.set('');
    }
  }

  /**
   * Compléter le tasting (DRAFT → COMPLETED)
   */
  async completeTasting(): Promise<void> {
    const id = this.tastingId();

    if (!id) {
      this.#toast.warning('Erreur: Tasting introuvable');
      return;
    }

    // Get data from FormService
    const finaleData = this.#formService.getCompleteTastingData();

    // Validate rating
    if (!finaleData.rating || finaleData.rating < 0.5) {
      this.#toast.warning('Veuillez donner une note avant de terminer');
      return;
    }

    try {
      this.isCompleting.set(true);
      this.#autoSave.saveStatus.set('Finalisation...');

      const completeDto: CompleteTastingDto = {
        rating: finaleData.rating,
        comment: finaleData.comment || undefined,
      };

      await this.#tastingStore.completeTasting.mutate({ id, data: completeDto });

      // Haptic feedback (mobile)
      if ('vibrate' in navigator) {
        navigator.vibrate([50, 100, 50]); // Triple vibration pour célébrer !
      }

      this.#autoSave.saveStatus.set('Terminé');

      // Clear draft state (tasting is now completed, not a draft anymore)
      this.existingDraft.set(null);
      this.confirmedDraftCigar.set(null);

      // Show success modal (no toast needed, modal is more elegant)
      this.showConfirmation.set(true);
    } catch (error) {
      this.#autoSave.saveStatus.set('Erreur');
      this.#toast.error('Erreur lors de la finalisation');
    } finally {
      this.isCompleting.set(false);
    }
  }

  /**
   * Supprimer le draft (avec confirmation)
   * TODO: Remplacer par une vraie modal de confirmation
   */
  async deleteDraft(): Promise<boolean> {
    const id = this.tastingId();
    if (!id) return false;

    // TODO: Utiliser ModalComponent pour une meilleure UX
    const confirmed = confirm('Voulez-vous vraiment supprimer ce brouillon ?');
    if (!confirmed) return false;

    try {
      await this.#tastingStore.deleteTasting.mutate(id);
      this.#toast.success('Brouillon supprimé');
      return true;
    } catch (error) {
      this.#toast.error('Erreur lors de la suppression');
      return false;
    }
  }

  // ==================== Flow Management ====================

  /**
   * CTA A: Passer au verdict
   * Scroll direct vers Phase Finale (skip observations)
   */
  handleCtaA_Verdict(): void {
    this.flowMode.set('quick');
    this.#scroll.scrollTo('phase-finale');
  }

  /**
   * CTA B: Approfondir la chronique
   * Premium → Reveal phases + scroll to Présentation
   * Free → Show Discovery bottom sheet
   */
  async handleCtaB_Chronique(): Promise<void> {
    if (this.#premiumAccess.isPremium()) {
      // Premium: Révéler toutes les phases et scroller
      this.flowMode.set('chronique');
      this.isDiscoveryMode.set(false);
      this.#revealChroniquePhases();
      await this.#scroll.scrollToAsync('phase-presentation');
    } else {
      // Free: Afficher Discovery bottom sheet
      this.showDiscoveryBottomSheet.set(true);
    }
  }

  /**
   * Discovery: Utilisateur Free confirme l'exploration
   * Révèle les phases mais pas de save en DB
   */
  async handleDiscovery_Confirm(): Promise<void> {
    this.showDiscoveryBottomSheet.set(false);
    this.flowMode.set('chronique');
    this.isDiscoveryMode.set(true);
    this.#revealChroniquePhases();
    await this.#scroll.scrollToAsync('phase-presentation');
  }

  /**
   * Discovery: Utilisateur Free annule (retour au verdict)
   */
  handleDiscovery_Cancel(): void {
    this.showDiscoveryBottomSheet.set(false);
    this.handleCtaA_Verdict();
  }

  /**
   * Discovery: Upgrade Premium
   */
  handleDiscovery_UpgradePremium(): void {
    this.showDiscoveryBottomSheet.set(false);
    // TODO: Navigate to premium upgrade page
    this.#toast.info('Fonctionnalité Premium à venir');
  }

  /**
   * Révéler les phases Chronique dans le DOM
   */
  #revealChroniquePhases(): void {
    const phases: TastingPhase[] = ['presentation', 'cold_draw', 'first_third', 'second_third', 'final_third', 'conclusion'];
    this.revealedPhases.update(set => {
      phases.forEach(phase => set.add(phase));
      return new Set(set);
    });
  }

  // ==================== Data Management ====================

  /**
   * Mettre à jour Phase Quick data
   * Crée le tasting si nécessaire (premier save avec cigarId)
   */
  async updateQuickData(data: UpdateTastingDto): Promise<void> {
    // Si pas de tasting créé ET qu'on a un cigarId VALIDE (UUID) → créer le tasting d'abord
    const isValidUuid = data.cigarId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.cigarId);

    if (!this.tastingId() && isValidUuid && data.cigarId) {
      // Type guard ensures cigarId is string at this point
      await this.#createNewDraft(data.cigarId, this.eventId());
    }

    // Only save if we have a valid tasting
    if (this.tastingId()) {
      this.#autoSave.saveTastingData(data);
    }
  }

  /**
   * Mettre à jour Finale data (local, save on complete)
   */
  updateFinaleData(data: { rating: number; comment: string }): void {
    this.finaleData.set(data);
    // Note: rating/comment sont sauvés au complete, pas au change
  }

  /**
   * Mettre à jour Observation
   */
  updateObservation(phase: string, data: any): void {
    this.#autoSave.saveObservation(
      phase,
      { organoleptic: data },
      this.isDiscoveryMode() // Skip save si Discovery mode
    );
  }

  // ==================== Navigation ====================

  /**
   * Scroller vers une phase
   */
  scrollToPhase(phaseId: string): void {
    this.#scroll.scrollTo(phaseId);
  }

  /**
   * Action "Suivant" contextuelle selon la phase courante
   * Utilisé par le SmartBar
   */
  async handleNextAction(): Promise<void> {
    const phase = this.currentPhase();

    switch (phase) {
      case 'quick':
        // Phase Quick terminée → Chronique
        await this.handleCtaB_Chronique();
        break;
      case 'finale':
        // Phase Finale → Compléter le tasting
        await this.completeTasting();
        break;
      default:
        // Autres phases → Scroller vers la phase suivante
        this.#scrollToNextPhase();
        break;
    }
  }

  /**
   * Scroller vers la phase suivante dans l'ordre
   */
  #scrollToNextPhase(): void {
    const phaseOrder: TastingPhase[] = [
      'quick',
      'presentation',
      'cold_draw',
      'first_third',
      'second_third',
      'final_third',
      'conclusion',
      'finale',
    ];

    const currentIndex = phaseOrder.indexOf(this.currentPhase());
    if (currentIndex >= 0 && currentIndex < phaseOrder.length - 1) {
      const nextPhase = phaseOrder[currentIndex + 1];
      this.#scroll.scrollTo(`phase-${nextPhase.replace('_', '-')}`);
    }
  }

  /**
   * Voir le tasting complété
   */
  viewTasting(): void {
    const id = this.tastingId();
    if (id) {
      void this.#router.navigate(['/tastings', id]);
    }
  }

  /**
   * Fermer (retour au dashboard)
   */
  close(): void {
    void this.#router.navigate(['/dashboard']);
  }

  /**
   * Gérer le retour (confirmation si non complété)
   */
  handleBack(): void {
    if (this.showConfirmation()) {
      // Tasting complété, fermer directement
      this.close();
    } else {
      // Tasting non complété, afficher modal de confirmation
      this.showExitConfirmation.set(true);
    }
  }

  /**
   * Confirmer la sortie (depuis la modal)
   */
  confirmExit(): void {
    this.showExitConfirmation.set(false);
    this.close();
  }

  // ==================== Cleanup ====================

  /**
   * Flush pending saves (avant ngOnDestroy du component)
   */
  async flush(): Promise<void> {
    await this.#autoSave.flush();
  }

  /**
   * Cleanup: Arrêter le timer
   */
  ngOnDestroy(): void {
    if (this.#timerInterval) {
      clearInterval(this.#timerInterval);
      this.#timerInterval = null;
    }
  }
}