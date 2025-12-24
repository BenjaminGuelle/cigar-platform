/**
 * Query Layer - All Stars Architecture 🌟
 *
 * Generic query and mutation management with Angular Signals
 * Inspired by TanStack Query patterns
 *
 * Features:
 * - Automatic caching with smart invalidation
 * - Loading/error states
 * - Shared queries between components
 * - Optimistic updates
 * - Type-safe
 *
 * @example
 * ```typescript
 * // In a component
 * user = injectQuery({
 *   queryKey: ['user', userId],
 *   queryFn: () => api.getUser(userId),
 * });
 *
 * updateUser = injectMutation({
 *   mutationFn: (data) => api.updateUser(data),
 *   invalidateQueries: [['user']], // Auto-refetch
 * });
 * ```
 */

// Types
export type {
  Query,
  QueryOptions,
  QueryState,
  Mutation,
  MutationOptions,
  MutationState,
} from './types/query.types';

// Base classes
export { QueryStoreBase } from './base/query-store.base';

// Services
export { QueryCacheService } from './services/query-cache.service';

// Factories (main API)
export { injectQuery } from './factories/inject-query';
export { injectMutation } from './factories/inject-mutation';
