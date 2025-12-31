import { inject } from '@angular/core';
import { injectQuery, injectMutation, QueryCacheService } from '../query';
import { CigarsService } from '@cigar-platform/types/lib/cigars/cigars.service';
import { BrandsService } from '@cigar-platform/types/lib/brands/brands.service';
import type { CreateCigarDto, CigarResponseDto } from '@cigar-platform/types';

/**
 * Cigar Store
 *
 * Manages cigar and brand data with reactive queries and mutations
 *
 * Features:
 * - Search brands for autocomplete
 * - Create cigars with inline brand creation
 * - Automatic cache invalidation
 *
 * Architecture: ALL STARS ⭐
 * - Reactive getters pattern
 * - Cache invalidation on mutations
 * - Type-safe from backend to frontend
 */
export function injectCigarStore() {
  const cigarsService = inject(CigarsService);
  const brandsService = inject(BrandsService);
  const queryCache = inject(QueryCacheService);

  return {
    /**
     * Query: Search brands for autocomplete
     * @param searchGetter - Reactive getter for search query
     */
    searchBrands: (searchGetter: () => string) =>
      injectQuery(() => ({
        queryKey: ['brands', 'search', searchGetter()],
        queryFn: () => brandsService.brandControllerFindAll({ search: searchGetter() }),
        enabled: searchGetter().trim().length > 0,
        staleTime: 5 * 60 * 1000, // 5 minutes
      })),

    /**
     * Query: Get cigar by slug (public endpoint)
     * @param slugGetter - Reactive getter for cigar slug
     */
    getCigarBySlug: (slugGetter: () => string) =>
      injectQuery(() => ({
        queryKey: ['cigars', 'detail', slugGetter()],
        queryFn: () => cigarsService.cigarControllerFindBySlug(slugGetter()),
        enabled: !!slugGetter(),
        staleTime: 5 * 60 * 1000, // 5 minutes (optimized for freshness)
      })),

    /**
     * Mutation: Create cigar with inline brand creation
     */
    createCigar: injectMutation<CigarResponseDto, CreateCigarDto>({
      mutationFn: (data: CreateCigarDto) => cigarsService.cigarControllerCreate(data),
      onSuccess: () => {
        // Invalidate cigars and brands queries
        queryCache.invalidateQueriesMatching(['cigars']);
        queryCache.invalidateQueriesMatching(['brands']);
      },
    }),
  };
}
