import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { Router } from '@angular/router';

/**
 * Context Types
 */
export type ContextType = 'solo' | 'club';

/**
 * Club Role (when in club context)
 */
export type ClubRole = 'member' | 'admin' | 'owner';

/**
 * App Context State
 */
export interface AppContext {
  type: ContextType;
  clubId: string | null;
  club: any | null; // TODO: Replace with ClubDto when available
  clubRole: ClubRole | null; // User's role in the active club (not platform role)
}

/**
 * Context Store
 *
 * Manages the active context (solo or club) of the application.
 * This determines what data is shown and what actions are available.
 *
 * Pattern:
 * - Solo context: User sees their own data
 * - Club context: User sees club data filtered by active club
 *
 * Context switching:
 * - Mobile: Via header avatar (bottom sheet)
 * - Desktop: Via sidebar avatars
 *
 * Persistence:
 * - Active context saved to localStorage
 * - Restored on app init
 *
 * @example
 * ```typescript
 * // Inject in component
 * contextStore = inject(ContextStore);
 *
 * // Check current context
 * if (this.contextStore.isSolo()) {
 *   // Show solo content
 * }
 *
 * // Switch to club
 * this.contextStore.switchToClub(club, 'member');
 *
 * // Switch to solo
 * this.contextStore.switchToSolo();
 * ```
 */
@Injectable({
  providedIn: 'root',
})
export class ContextStore {
  #router = inject(Router);

  /**
   * Active context state
   */
  #context = signal<AppContext>({
    type: 'solo',
    clubId: null,
    club: null,
    clubRole: null,
  });

  /**
   * Read-only active context
   */
  readonly context = this.#context.asReadonly();

  /**
   * Available clubs for current user
   * Loaded on app init
   */
  #userClubs = signal<any[]>([]); // TODO: Replace with ClubDto[]

  /**
   * Read-only user clubs
   */
  readonly userClubs = this.#userClubs.asReadonly();

  /**
   * Loading state for clubs
   */
  #loadingClubs = signal<boolean>(false);

  readonly loadingClubs = this.#loadingClubs.asReadonly();

  // ==================== Computed Values ====================

  /**
   * Is current context solo?
   */
  readonly isSolo = computed<boolean>(() => this.context().type === 'solo');

  /**
   * Is current context club?
   */
  readonly isClub = computed<boolean>(() => this.context().type === 'club');

  /**
   * Is user admin in current club context?
   * Checks club role, not platform role
   */
  readonly isClubAdmin = computed<boolean>(() => {
    const ctx = this.context();
    if (ctx.type !== 'club' || !ctx.clubRole) {
      return false;
    }
    return ctx.clubRole === 'admin' || ctx.clubRole === 'owner';
  });

  /**
   * Alias for isClubAdmin (more explicit)
   */
  readonly canManageClub = this.isClubAdmin;

  /**
   * Current context name for display
   */
  readonly contextName = computed<string>(() => {
    const ctx = this.context();
    return ctx.type === 'solo' ? 'Moi' : ctx.club?.name ?? 'Club';
  });

  /**
   * Current context avatar
   * Returns user avatar in solo, club avatar in club context
   */
  readonly contextAvatar = computed<any>(() => {
    const ctx = this.context();
    return ctx.type === 'solo' ? null : ctx.club; // Will be used in avatar component
  });

  /**
   * Active club ID (null if solo)
   */
  readonly activeClubId = computed<string | null>(() => {
    const ctx = this.context();
    return ctx.type === 'club' ? ctx.clubId : null;
  });

  // ==================== Constructor ====================

  constructor() {
    // Persist context changes to localStorage
    effect(() => {
      const ctx = this.context();
      this.#persistContext(ctx);
    });

    // Initialize context from localStorage on app start
    // Will be called by app initializer
  }

  // ==================== Public Methods ====================

  /**
   * Switch to solo context
   */
  switchToSolo(): void {
    this.#context.set({
      type: 'solo',
      clubId: null,
      club: null,
      clubRole: null,
    });

    console.log('[ContextStore] Switched to solo context');
  }

  /**
   * Switch to club context
   */
  switchToClub(club: any, role: ClubRole): void {
    this.#context.set({
      type: 'club',
      clubId: club.id,
      club,
      clubRole: role,
    });

    console.log(`[ContextStore] Switched to club context: ${club.name} (${role})`);
  }

  /**
   * Load user's clubs
   * Called on app init
   */
  async loadUserClubs(): Promise<void> {
    this.#loadingClubs.set(true);

    try {
      // TODO: Call API to fetch user's clubs
      // const clubs = await this.clubsService.getUserClubs();
      // this.#userClubs.set(clubs);

      // Mock data for now
      const mockClubs = [
        {
          id: 'club-1',
          name: 'Havana Club',
          avatarUrl: null,
          memberCount: 45,
        },
        {
          id: 'club-2',
          name: 'Les Aficionados',
          avatarUrl: null,
          memberCount: 23,
        },
      ];

      this.#userClubs.set(mockClubs);

      console.log('[ContextStore] Loaded user clubs:', mockClubs.length);
    } catch (error) {
      console.error('[ContextStore] Failed to load user clubs:', error);
      this.#userClubs.set([]);
    } finally {
      this.#loadingClubs.set(false);
    }
  }

  /**
   * Initialize context from localStorage
   * Called on app init
   */
  initializeContext(): void {
    const saved = this.#loadPersistedContext();

    if (!saved) {
      console.log('[ContextStore] No persisted context, defaulting to solo');
      this.switchToSolo();
      return;
    }

    if (saved.type === 'solo') {
      this.switchToSolo();
      console.log('[ContextStore] Restored solo context from localStorage');
      return;
    }

    if (saved.type === 'club' && saved.clubId) {
      // Need to restore club context
      // We need to fetch the club data first
      this.#restoreClubContext(saved.clubId);
      console.log('[ContextStore] Restoring club context from localStorage:', saved.clubId);
      return;
    }

    // Fallback to solo
    this.switchToSolo();
  }

  /**
   * Add a club to user's clubs
   * Called after joining or creating a club
   */
  addUserClub(club: any): void {
    const current = this.#userClubs();
    if (current.find((c) => c.id === club.id)) {
      console.log('[ContextStore] Club already in user clubs');
      return;
    }

    this.#userClubs.set([...current, club]);
    console.log('[ContextStore] Added club to user clubs:', club.name);
  }

  /**
   * Remove a club from user's clubs
   * Called after leaving a club
   */
  removeUserClub(clubId: string): void {
    const current = this.#userClubs();
    this.#userClubs.set(current.filter((c) => c.id !== clubId));

    // If we're in the club that was removed, switch to solo
    const ctx = this.context();
    if (ctx.type === 'club' && ctx.clubId === clubId) {
      this.switchToSolo();
    }

    console.log('[ContextStore] Removed club from user clubs:', clubId);
  }

  // ==================== Private Methods ====================

  /**
   * Persist context to localStorage
   */
  #persistContext(context: AppContext): void {
    const toSave = {
      type: context.type,
      clubId: context.clubId,
      // Don't save full club object, only ID (we'll refetch on restore)
    };

    try {
      localStorage.setItem('app-context', JSON.stringify(toSave));
    } catch (error) {
      console.error('[ContextStore] Failed to persist context:', error);
    }
  }

  /**
   * Load persisted context from localStorage
   */
  #loadPersistedContext(): { type: ContextType; clubId: string | null } | null {
    try {
      const saved = localStorage.getItem('app-context');
      if (!saved) {
        return null;
      }

      return JSON.parse(saved);
    } catch (error) {
      console.error('[ContextStore] Failed to load persisted context:', error);
      return null;
    }
  }

  /**
   * Restore club context by fetching club data
   */
  async #restoreClubContext(clubId: string): Promise<void> {
    try {
      // TODO: Fetch club data from API
      // const club = await this.clubsService.getClubById(clubId);
      // const userRole = await this.clubsService.getUserRoleInClub(clubId);
      // this.switchToClub(club, userRole);

      // For now, check if club is in userClubs
      const clubs = this.#userClubs();
      const club = clubs.find((c) => c.id === clubId);

      if (club) {
        this.switchToClub(club, 'member'); // TODO: Get actual role
      } else {
        // Club not found, fallback to solo
        console.warn('[ContextStore] Club not found in user clubs, falling back to solo');
        this.switchToSolo();
      }
    } catch (error) {
      console.error('[ContextStore] Failed to restore club context:', error);
      this.switchToSolo();
    }
  }
}
