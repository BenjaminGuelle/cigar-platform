import { Injectable, signal, computed, inject, WritableSignal, Signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { AuthError, Session } from '@supabase/supabase-js';
import { Observable, from, of, EMPTY } from 'rxjs';
import { tap, map, catchError, switchMap, take, finalize } from 'rxjs/operators';
import { SupabaseService } from './supabase.service';
import { AuthenticationService } from '@cigar-platform/types/lib/authentication/authentication.service';
import { QueryCacheService } from '../query/services/query-cache.service';
import type { UserWithAuth } from '@cigar-platform/types';

export interface AuthResult {
  error: AuthError | null;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  #supabaseService = inject(SupabaseService);
  #authenticationService = inject(AuthenticationService);
  #queryCache = inject(QueryCacheService);
  #router = inject(Router);
  #destroyRef = inject(DestroyRef);

  #currentUserSignal: WritableSignal<UserWithAuth | null> = signal<UserWithAuth | null>(null);
  #sessionSignal: WritableSignal<Session | null> = signal<Session | null>(null);
  #loadingSignal: WritableSignal<boolean> = signal<boolean>(true);

  readonly currentUser: Signal<UserWithAuth | null> = this.#currentUserSignal.asReadonly();
  readonly session: Signal<Session | null> = this.#sessionSignal.asReadonly();
  readonly loading: Signal<boolean> = this.#loadingSignal.asReadonly();
  readonly isAuthenticated: Signal<boolean> = computed(() => this.#currentUserSignal() !== null);

  constructor() {
    this.#initializeAuth();
  }

  #initializeAuth(): void {
    from(this.#supabaseService.client.auth.getSession())
      .pipe(
        tap(({ data: { session } }) => {
          if (session) {
            this.#sessionSignal.set(session);
          }
        }),
        switchMap(({ data: { session } }) =>
          session ? this.#loadUserProfile() : of(null)
        ),
        catchError((error) => {
          // Error handled silently
          return of(null);
        }),
        finalize(() => this.#loadingSignal.set(false)),
        takeUntilDestroyed(this.#destroyRef)
      )
      .subscribe();

    const { data } = this.#supabaseService.client.auth.onAuthStateChange((_event, session) => {
      this.#sessionSignal.set(session);

      if (session?.user) {
        this.#loadUserProfile().pipe(take(1)).subscribe();
      } else {
        this.#currentUserSignal.set(null);
      }
    });

    // Cleanup auth state listener on service destroy
    this.#destroyRef.onDestroy(() => {
      data.subscription.unsubscribe();
    });
  }

  #loadUserProfile(): Observable<UserWithAuth | null> {
    return from(this.#authenticationService.authControllerGetProfile()).pipe(
      map((user) => user ?? null),
      tap((user) => this.#currentUserSignal.set(user)),
      catchError((error) => {
        // Error handled silently
        return of(null);
      })
    );
  }

  signUp(
    email: string,
    password: string,
    displayName: string
  ): Observable<AuthResult> {
    return from(
      this.#authenticationService.authControllerSignUp({ email, password, displayName })
    ).pipe(
      tap((result) => {
        this.#sessionSignal.set(result.session as any as Session);
        this.#currentUserSignal.set(result.user);
      }),
      map(() => ({ error: null })),
      catchError((httpError) => {
        const error: AuthError = {
          message: httpError.error?.error?.message || httpError.error?.message || 'Erreur lors de l\'inscription',
          status: httpError.status,
        } as AuthError;
        return of({ error });
      })
    );
  }

  signIn(email: string, password: string): Observable<AuthResult> {
    return from(
      this.#supabaseService.client.auth.signInWithPassword({
        email,
        password,
      })
    ).pipe(
      switchMap(({ data, error }) => {
        if (error) {
          return of({ error });
        }

        if (!data.session) {
          return of({ error: null });
        }

        this.#sessionSignal.set(data.session);

        return this.#loadUserProfile().pipe(
          map(() => ({ error: null }))
        );
      }),
      catchError((error) => of({ error: error as AuthError }))
    );
  }

  signInWithGoogle(): Observable<AuthResult> {
    return from(
      this.#supabaseService.client.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      })
    ).pipe(
      map(({ error }) => ({ error })),
      catchError((error) => of({ error: error as AuthError }))
    );
  }

  signOut(): Observable<void> {
    return from(this.#supabaseService.client.auth.signOut()).pipe(
      tap(() => {
        // Clear user signals
        this.#currentUserSignal.set(null);
        this.#sessionSignal.set(null);

        // Clear ALL STARS cache to prevent stale data on next login
        this.#queryCache.clear();
      }),
      switchMap(() => from(this.#router.navigate(['/auth/login']))),
      map(() => undefined),
      catchError((error) => {
        // Error handled silently
        return EMPTY;
      })
    );
  }

  resetPassword(email: string): Observable<AuthResult> {
    return from(
      this.#supabaseService.client.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })
    ).pipe(
      map(({ error }) => ({ error })),
      catchError((error) => of({ error: error as AuthError }))
    );
  }

  updatePassword(newPassword: string): Observable<AuthResult> {
    return from(
      this.#supabaseService.client.auth.updateUser({
        password: newPassword,
      })
    ).pipe(
      map(({ error }) => ({ error })),
      catchError((error) => of({ error: error as AuthError }))
    );
  }

  getAccessToken(): string | null {
    return this.#sessionSignal()?.access_token ?? null;
  }

  /**
   * Update current user signal (for profile updates from UserStore)
   */
  updateCurrentUser(user: UserWithAuth): void {
    this.#currentUserSignal.set(user);
  }
}
