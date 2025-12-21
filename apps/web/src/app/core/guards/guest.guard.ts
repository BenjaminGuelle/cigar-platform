import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { toObservable } from '@angular/core/rxjs-interop';
import { map, filter, take } from 'rxjs/operators';
import { AuthService } from '../services';

/**
 * Guest Guard - Protège les routes publiques (auth)
 * Redirige vers / si l'utilisateur est déjà authentifié
 * Empêche d'accéder à login/register quand on est déjà connecté
 */
export const guestGuard: CanActivateFn = () => {
  const authService: AuthService = inject(AuthService);
  const router: Router = inject(Router);

  return toObservable(authService.loading).pipe(
    filter((loading: boolean) => !loading),
    take(1),
    map(() => {
      if (!authService.isAuthenticated()) {
        return true;
      }
      return router.createUrlTree(['/']);
    })
  );
};
