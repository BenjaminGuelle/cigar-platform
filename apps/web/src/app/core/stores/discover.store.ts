import { inject } from '@angular/core';
import { injectQuery } from '../query';
import type { Query } from '../query';
import { DiscoverService } from '@cigar-platform/types/lib/discover/discover.service';
import type { DiscoverResponseDto } from '@cigar-platform/types';

/**
 * Discover Store
 * Manages discovery content for explore page
 *
 * ALL STARS Architecture ⭐
 * - Uses Orval-generated DiscoverService
 * - Reactive with Query Layer
 * - Caching for optimal performance
 * - Type-safe with generated types
 *
 * Features:
 * - Recent cigars (3 newest)
 * - Recent public tastings (6 newest)
 * - Public endpoint (no auth required)
 *
 * @example
 * ```typescript
 * @Component({...})
 * export class ExplorePage {
 *   discoverStore = injectDiscoverStore();
 *   discoveryQuery = this.discoverStore.getDiscoveryContent();
 *
 *   recentCigars = computed(() => this.discoveryQuery.data()?.recentCigars ?? []);
 *   recentTastings = computed(() => this.discoveryQuery.data()?.recentTastings ?? []);
 * }
 * ```
 */
export interface DiscoverStore {
  /**
   * Get discovery content (recent cigars + public tastings)
   */
  getDiscoveryContent: () => Query<DiscoverResponseDto>;
}

/**
 * Inject Discover Store
 * Factory function following ALL STARS store pattern
 */
export function injectDiscoverStore(): DiscoverStore {
  const discoverService = inject(DiscoverService);

  /**
   * Discovery content query with caching
   * Uses Orval-generated DiscoverService
   */
  const getDiscoveryContent = (): Query<DiscoverResponseDto> => {
    return injectQuery(() => ({
      queryKey: ['discover'],
      queryFn: async (): Promise<DiscoverResponseDto> => {
        return discoverService.discoverControllerGetDiscoveryContent();
      },
      staleTime: 1000 * 60 * 5, // 5 minutes cache
    }));
  };

  return {
    getDiscoveryContent,
  };
}