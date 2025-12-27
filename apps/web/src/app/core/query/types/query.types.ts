import { Signal } from '@angular/core';

/**
 * Query State
 * Represents the state of a query (data fetching operation)
 */
export interface QueryState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  lastFetched: number | null;
  staleTime: number; // milliseconds before data is considered stale
}

/**
 * Query Options
 * Configuration for a query
 */
export interface QueryOptions<T> {
  queryKey: unknown[];
  queryFn: () => Promise<T>;
  staleTime?: number; // default: 5 minutes
  enabled?: boolean | Signal<boolean>; // default: true
}

/**
 * Query
 * The public interface returned by injectQuery()
 */
export interface Query<T> {
  data: Signal<T | null>;
  loading: Signal<boolean>;
  error: Signal<Error | null>;
  isStale: Signal<boolean>;
  refetch: () => Promise<void>;
  invalidate: () => void;
  setData: (data: T) => void; // For optimistic updates (no timestamp update)
  setDataFresh: (data: T) => void; // Set data + mark as fresh
}

/**
 * Mutation State
 * Represents the state of a mutation (data modification operation)
 */
export interface MutationState {
  loading: boolean;
  error: Error | null;
}

/**
 * Mutation Context
 * Returned by onMutate, passed to onSuccess/onError for rollback
 */
export interface MutationContext {
  [key: string]: unknown;
}

/**
 * Mutation Options
 * Configuration for a mutation
 */
export interface MutationOptions<TData, TVariables> {
  /**
   * Function that performs the mutation
   */
  mutationFn: (variables: TVariables) => Promise<TData>;

  /**
   * Callback before mutation starts (for optimistic updates)
   * Return context for rollback in onError
   */
  onMutate?: (variables: TVariables) => MutationContext | void;

  /**
   * Callback on successful mutation
   */
  onSuccess?: (data: TData, variables: TVariables, context?: MutationContext) => void | Promise<void>;

  /**
   * Callback on failed mutation
   */
  onError?: (error: Error, variables: TVariables, context?: MutationContext) => void;

  /**
   * Query keys to invalidate after successful mutation
   */
  invalidateQueries?: unknown[][];
}

/**
 * Mutation
 * The public interface returned by injectMutation()
 */
export interface Mutation<TData, TVariables> {
  mutate: (variables: TVariables) => Promise<TData | null>;
  loading: Signal<boolean>;
  error: Signal<Error | null>;
  reset: () => void;
}
