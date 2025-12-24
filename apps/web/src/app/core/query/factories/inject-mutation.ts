import { inject, signal } from '@angular/core';
import { QueryCacheService } from '../services/query-cache.service';
import type { Mutation, MutationOptions } from '../types/query.types';

/**
 * Inject Mutation
 * Factory function that creates a mutation for data modifications
 *
 * Features:
 * - Loading/error states
 * - Success/error callbacks
 * - Automatic query invalidation
 * - Reset functionality
 *
 * @example
 * ```typescript
 * @Component({...})
 * export class UserComponent {
 *   updateUser = injectMutation({
 *     mutationFn: (data: UpdateUserDto) =>
 *       this.api.updateUser(data),
 *     onSuccess: (user) => {
 *       console.log('User updated!', user);
 *     },
 *     invalidateQueries: [['user']], // Refetch user query
 *   });
 *
 *   async onSubmit(data: UpdateUserDto) {
 *     const result = await this.updateUser.mutate(data);
 *     if (result) {
 *       // Success!
 *     }
 *   }
 * }
 *
 * // Template
 * <button
 *   (click)="onSubmit(form.value)"
 *   [disabled]="updateUser.loading()"
 * >
 *   {{ updateUser.loading() ? 'Saving...' : 'Save' }}
 * </button>
 * ```
 */
export function injectMutation<TData, TVariables>(
  options: MutationOptions<TData, TVariables>
): Mutation<TData, TVariables> {
  const queryCache = inject(QueryCacheService);

  // Mutation state
  const loading = signal(false);
  const error = signal<Error | null>(null);

  /**
   * Execute mutation
   */
  const mutate = async (variables: TVariables): Promise<TData | null> => {
    // onMutate - Optimistic update phase
    const mutateResult = options.onMutate?.(variables);
    const context = mutateResult !== undefined ? mutateResult : undefined;

    loading.set(true);
    error.set(null);

    try {
      // Execute mutation
      const data = await options.mutationFn(variables);

      loading.set(false);

      // Success callback
      await options.onSuccess?.(data, variables, context);

      // Invalidate queries
      if (options.invalidateQueries) {
        for (const queryKey of options.invalidateQueries) {
          queryCache.invalidateQuery(queryKey);
        }
      }

      return data;
    } catch (err) {
      const mutationError = err as Error;

      loading.set(false);
      error.set(mutationError);

      // Error callback with context for rollback
      options.onError?.(mutationError, variables, context);

      return null;
    }
  };

  /**
   * Reset mutation state
   */
  const reset = (): void => {
    loading.set(false);
    error.set(null);
  };

  return {
    mutate,
    loading: loading.asReadonly(),
    error: error.asReadonly(),
    reset,
  };
}
