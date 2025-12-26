import { Injectable, inject } from '@angular/core';
import { ClubsService } from '@cigar-platform/types/lib/clubs/clubs.service';
import type { ClubResponseDto } from '@cigar-platform/types';

/**
 * Search Entity Types
 * MVP: clubs only
 * Future: users, events, cigars
 */
export type SearchEntityType = 'club' | 'user' | 'event' | 'cigar';

/**
 * Club Search Result
 */
export interface ClubSearchResult {
  id: string;
  name: string;
  description: string | null;
  visibility: 'PUBLIC' | 'PRIVATE';
  memberCount: number;
  avatarUrl?: string | null;
}

/**
 * Grouped Search Results
 * Extensible for future entity types
 */
export interface SearchResults {
  clubs: ClubSearchResult[];
  users: unknown[]; // future
  events: unknown[]; // future
  cigars: unknown[]; // future
}

/**
 * Search Filters
 */
export interface SearchFilters {
  entityType?: SearchEntityType;
  limit?: number;
}

/**
 * Global Search Service
 *
 * Stateless service for search operations
 * Works with TanStack Query (injectQuery) for caching and reactivity
 *
 * Features:
 * - Promise-based (query layer compatible)
 * - Client-side smart filtering
 * - Extensible architecture (MVP: clubs only)
 * - Type-safe
 *
 * Architecture:
 * - No state, pure functions
 * - Returns Promises for injectQuery
 * - Debouncing handled by component
 */
@Injectable({
  providedIn: 'root',
})
export class GlobalSearchService {
  #clubsService = inject(ClubsService);

  /**
   * Search clubs
   * Promise-based for query layer integration
   *
   * @param query - Search query string
   * @param limit - Max results (default 20)
   * @returns Promise of club search results
   */
  async searchClubs(query: string, limit: number = 20): Promise<ClubSearchResult[]> {
    // Empty query returns empty results
    if (!query || query.trim().length === 0) {
      return [];
    }

    const trimmedQuery = query.trim().toLowerCase();

    try {
      const response: any = await this.#clubsService.clubControllerFindAll({
        limit: 100, // Fetch more for client-side filtering
        page: 1,
      });

      const clubs: ClubResponseDto[] = response?.data ?? [];

      // Client-side smart filtering
      // TODO: Move to server-side when API supports search
      const filtered = clubs.filter((club) => {
        const name = club.name.toLowerCase();
        const description = club.description ? String(club.description).toLowerCase() : '';
        const visibility = club.visibility.toLowerCase();

        // Match name or description (includes or starts with)
        const matchesName = name.includes(trimmedQuery);
        const matchesDescription = description.includes(trimmedQuery);

        // Visibility keywords with prefix matching
        // User can type "p", "pu", "pub", "publi", "public" to find PUBLIC clubs
        const publicKeywords = ['public', 'publique'];
        const privateKeywords = ['privé', 'prive', 'private'];

        const matchesPublicKeyword = publicKeywords.some((kw) => {
          // Check if keyword starts with query OR query is contained in keyword
          return kw.startsWith(trimmedQuery) || trimmedQuery.includes(kw);
        });

        const matchesPrivateKeyword = privateKeywords.some((kw) => {
          // Check if keyword starts with query OR query is contained in keyword
          return kw.startsWith(trimmedQuery) || trimmedQuery.includes(kw);
        });

        const matchesVisibility =
          (matchesPublicKeyword && visibility === 'public') ||
          (matchesPrivateKeyword && visibility === 'private');

        return matchesName || matchesDescription || matchesVisibility;
      });

      // Limit results
      const limited = filtered.slice(0, limit);

      // Map to ClubSearchResult
      return limited.map((club) => ({
        id: club.id,
        name: club.name,
        description: club.description ? String(club.description) : null,
        visibility: club.visibility,
        memberCount: (club as any).memberCount ?? 0,
        avatarUrl: (club as any).avatarUrl ?? null,
      }));
    } catch (error) {
      console.error('[GlobalSearchService] Search clubs error:', error);
      return [];
    }
  }

  /**
   * Search all entities (grouped results)
   * MVP: Clubs only
   * Future: users, events, cigars
   *
   * @param query - Search query string
   * @param filters - Optional filters
   * @returns Promise of grouped search results
   */
  async search(query: string, filters?: SearchFilters): Promise<SearchResults> {
    const limit = filters?.limit ?? 20;

    // MVP: Search clubs only
    const clubs = await this.searchClubs(query, limit);

    return {
      clubs,
      users: [], // future
      events: [], // future
      cigars: [], // future
    };
  }
}
