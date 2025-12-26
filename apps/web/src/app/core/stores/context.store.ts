import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { Router } from '@angular/router';
import { ClubsService } from '@cigar-platform/types/lib/clubs/clubs.service';
import type { ClubResponseDto, UpdateMemberRoleDtoRole } from '@cigar-platform/types';

/**
 * Context Types
 */
export type ContextType = 'solo' | 'club';

/**
 * Club Role (when in club context)
 */
export type ClubRole = UpdateMemberRoleDtoRole;

/**
 * App Context State
 */
export interface AppContext {
  type: ContextType;
  clubId: string | null;
  club: ClubResponseDto | null;
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
  #clubsService = inject(ClubsService);

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
  #userClubs = signal<ClubResponseDto[]>([]);

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
  switchToClub(club: ClubResponseDto, role: ClubRole): void {
    this.#context.set({
      type: 'club',
      clubId: club.id,
      club,
      clubRole: role,
    });

    console.log(`[ContextStore] Switched to club context: ${club.name} (${role})`);
  }

  /**
   * Load user's clubs with their role
   * ALL STARS: Single optimized query, includes role
   */
  async loadUserClubs(): Promise<void> {
    this.#loadingClubs.set(true);

    try {
      // GET /clubs/me returns clubs with myRole included
      const myClubs: any = await this.#clubsService.clubControllerFindMyClubs();

      if (Array.isArray(myClubs)) {
        // Store clubs (myRole is included in each club object)
        this.#userClubs.set(myClubs);
        console.log('[ContextStore] Loaded user clubs:', myClubs.length);
      } else {
        console.warn('[ContextStore] Unexpected response format:', myClubs);
        this.#userClubs.set([]);
      }
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
   * CRITICAL: Must load user clubs FIRST to have roles available
   */
  async initializeContext(): Promise<void> {
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
      // CRITICAL: Load user clubs FIRST to get roles
      await this.loadUserClubs();

      // Now restore club context with role from loaded clubs
      await this.#restoreClubContext(saved.clubId);
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
  addUserClub(club: ClubResponseDto): void {
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

  /**
   * Refresh current context
   * Reloads club data if in club context
   */
  async refresh(): Promise<void> {
    const ctx = this.context();
    if (ctx.type === 'club' && ctx.clubId) {
      await this.#restoreClubContext(ctx.clubId);
    }
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
   * Restore club context by finding club in loaded clubs (with role)
   */
  async #restoreClubContext(clubId: string): Promise<void> {
    try {
      // Find club in user's loaded clubs (which includes myRole)
      const myClub: any = this.#userClubs().find((c: any) => c.id === clubId);

      if (myClub && myClub.myRole) {
        // Club found in user's clubs with role
        this.switchToClub(myClub, myClub.myRole);
        console.log(`[ContextStore] Restored club context with role: ${myClub.myRole}`);
      } else {
        // Club not in user's clubs, fetch it and use default role
        const club = await this.#clubsService.clubControllerFindOne(clubId);
        if (club) {
          // Fallback: use member role if not found in user's clubs
          this.switchToClub(club, 'member');
          console.warn('[ContextStore] Club restored but role unknown, defaulting to member');
        } else {
          console.warn('[ContextStore] Club not found, falling back to solo');
          this.switchToSolo();
        }
      }
    } catch (error) {
      console.error('[ContextStore] Failed to restore club context:', error);
      this.switchToSolo();
    }
  }
}
