import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { ClubsService } from '@cigar-platform/types/lib/clubs/clubs.service';
import type { ClubResponseDto, UpdateMemberRoleDtoRole } from '@cigar-platform/types';
import { injectQuery, QueryCacheService } from '../query';

/**
 * LocalStorage key for persisting context
 */
const CONTEXT_STORAGE_KEY = 'app-context';

/**
 * Context Types
 */
export type ContextType = 'solo' | 'club';

/**
 * Club Role (when in club context)
 */
export type ClubRole = UpdateMemberRoleDtoRole;

/**
 * Club with user's role (returned by /clubs/me)
 */
export interface ClubWithRole extends ClubResponseDto {
  myRole: ClubRole;
}

/**
 * App Context State
 */
export interface AppContext {
  type: ContextType;
  clubId: string | null;
  club: ClubResponseDto | null;
  clubRole: ClubRole | null;
}

/**
 * Persisted Context (saved to localStorage)
 */
interface PersistedContext {
  type: ContextType;
  clubId: string | null;
}

/**
 * Context Store (ALL STARS)
 *
 * Manages the active context (solo or club) of the application.
 * Optimized with single /clubs/me query and proper initialization.
 *
 * Features:
 * - Solo/Club context switching
 * - Role-based permissions (owner/admin/member)
 * - LocalStorage persistence
 * - Automatic restoration on app init
 *
 * @example
 * ```typescript
 * contextStore = inject(ContextStore);
 *
 * // Check current context type
 * if (contextStore.context().type === 'solo') {
 *   // Solo mode
 * }
 *
 * // Check permissions
 * if (contextStore.canManageClub()) {
 *   // User can manage club
 * }
 *
 * // Switch context
 * contextStore.switchToClub(club, 'owner');
 * contextStore.switchToSolo();
 * ```
 */
@Injectable({
  providedIn: 'root',
})
export class ContextStore {
  readonly #clubsService = inject(ClubsService);
  readonly #queryCache = inject(QueryCacheService);

  // ==================== State ====================

  /**
   * Active context state
   */
  readonly #context = signal<AppContext>({
    type: 'solo',
    clubId: null,
    club: null,
    clubRole: null,
  });

  /**
   * User's clubs with their roles (Query Layer)
   */
  readonly #userClubsQuery = injectQuery<ClubWithRole[]>(() => ({
    queryKey: ['clubs', 'my-clubs'],
    queryFn: async () => {
      const myClubs = await this.#clubsService.clubControllerFindMyClubs();
      if (Array.isArray(myClubs)) {
        return myClubs as ClubWithRole[];
      }
      return [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: false, // Disable auto-fetch, manual trigger
  }));

  // ==================== Public Signals ====================

  readonly context = this.#context.asReadonly();
  readonly userClubs = computed(() => this.#userClubsQuery.data() ?? []);

  // ==================== Computed ====================

  /**
   * Can user manage the current club?
   * Returns true if user is owner or admin in club context
   */
  readonly canManageClub = computed<boolean>(() => {
    const ctx = this.context();
    if (ctx.type !== 'club' || !ctx.clubRole) {
      return false;
    }
    return ctx.clubRole === 'admin' || ctx.clubRole === 'owner';
  });

  /**
   * Can user access club settings?
   * Returns true for ANY role in club context (member, admin, owner)
   * - Members can access to leave the club
   * - Admins can edit description + leave
   * - Owners have full access
   */
  readonly canAccessSettings = computed<boolean>(() => {
    const ctx = this.context();
    return ctx.type === 'club' && ctx.clubRole !== null;
  });

  /**
   * Can user edit critical club settings?
   * Returns true if user is owner in club context
   * Critical settings: name, privacy, cover, delete club
   */
  readonly canEditCriticalSettings = computed<boolean>(() => {
    const ctx = this.context();
    return ctx.type === 'club' && ctx.clubRole === 'owner';
  });

  /**
   * Is user the owner of the current club?
   * Returns true if user is owner in club context
   */
  readonly isOwner = computed<boolean>(() => {
    const ctx = this.context();
    return ctx.type === 'club' && ctx.clubRole === 'owner';
  });

  // ==================== Constructor ====================

  constructor() {
    // Auto-persist context changes to localStorage
    effect(() => {
      const ctx = this.context();
      this.#persistContext(ctx);
    });
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
  }

  /**
   * Switch to club context
   *
   * Optimized for instant navigation (ALL STARS ⭐):
   * - Uses cached data if fresh (determined by staleTime)
   * - Auto-refetch if stale (join-requests: 1min, members: 2min, detail: 5min)
   * - Mutations continue to invalidate after critical actions (approve, ban, etc.)
   * - No forced invalidation on navigation = No loading flicker
   */
  switchToClub(club: ClubResponseDto, role: ClubRole): void {
    this.#context.set({
      type: 'club',
      clubId: club.id,
      club,
      clubRole: role,
    });

    // Note: Queries will auto-refetch if stale based on their staleTime.
    // Mutations (updateJoinRequest, banMember, etc.) handle invalidation.
  }

  /**
   * Update current club data without refetching
   * Used for optimistic updates after mutations (e.g., updateClub)
   */
  updateCurrentClub(updatedClub: ClubResponseDto): void {
    const currentContext = this.context();
    if (currentContext.type === 'club' && currentContext.clubId === updatedClub.id) {
      this.#context.set({
        ...currentContext,
        club: updatedClub,
      });
    }
  }

  /**
   * Load user's clubs with roles (Query Layer)
   * Single optimized query: GET /clubs/me
   * Uses query layer with automatic error handling and caching
   */
  async loadUserClubs(): Promise<void> {
    await this.#userClubsQuery.refetch();
  }

  /**
   * Initialize context from localStorage (SYNC - No API calls)
   * Called by APP_INITIALIZER on app start
   *
   * Senior Dev Pattern: Optimistic State Restoration
   * - Reads localStorage (instant)
   * - Restores "pending" club context if needed (clubId only, no club data)
   * - NO API calls (prevents 401 before authentication)
   * - HomeComponent will hydrate with real data after auth
   */
  async initializeContext(): Promise<void> {
    const saved = this.#loadPersistedContext();

    // Default to solo if no saved context
    if (!saved || saved.type === 'solo') {
      this.switchToSolo();
      return;
    }

    // Restore club context in "pending" state (optimistic)
    if (saved.type === 'club' && saved.clubId) {
      this.#context.set({
        type: 'club',
        clubId: saved.clubId,
        club: null,      // ← Will be hydrated after auth in HomeComponent
        clubRole: null,  // ← Will be hydrated after auth in HomeComponent
      });
    }
  }

  /**
   * Refresh current context
   * Reloads club data and role from server
   */
  async refresh(): Promise<void> {
    const ctx = this.context();

    if (ctx.type === 'club' && ctx.clubId) {
      // Reload all clubs to get updated data
      await this.loadUserClubs();

      // Find and restore the current club with updated data
      const updatedClub = this.userClubs().find((c) => c.id === ctx.clubId);

      if (updatedClub) {
        this.switchToClub(updatedClub, updatedClub.myRole);
      } else {
        // Club not found (maybe user was removed), switch to solo
        this.switchToSolo();
      }
    }
  }

  /**
   * Hydrate club context with real data after authentication
   *
   * Called by HomeComponent after clubs are loaded to upgrade
   * "pending" club context (from localStorage) with real API data
   *
   * Senior Dev Pattern: Progressive Enhancement
   * - Assumes clubs are already loaded via loadUserClubs()
   * - Finds club by ID in loaded clubs
   * - Upgrades context from { clubId: '123', club: null } to full club data
   * - Falls back to solo if club not found (user removed from club)
   */
  hydrateClubContext(clubId: string): void {
    const clubs = this.userClubs();
    const club = clubs.find((c) => c.id === clubId);

    if (club) {
      // Hydrate with real data
      this.switchToClub(club, club.myRole);
    } else {
      // Club not found (user removed or club deleted), fallback to solo
      this.switchToSolo();
    }
  }

  // ==================== Private Methods ====================

  /**
   * Persist context to localStorage
   */
  #persistContext(context: AppContext): void {
    const toSave: PersistedContext = {
      type: context.type,
      clubId: context.clubId,
    };

    try {
      localStorage.setItem(CONTEXT_STORAGE_KEY, JSON.stringify(toSave));
    } catch (error) {
      // Silent fail - not critical
    }
  }

  /**
   * Load persisted context from localStorage
   */
  #loadPersistedContext(): PersistedContext | null {
    try {
      const saved = localStorage.getItem(CONTEXT_STORAGE_KEY);
      if (!saved) {
        return null;
      }

      return JSON.parse(saved) as PersistedContext;
    } catch (error) {
      // Silent fail - return null
      return null;
    }
  }

}
