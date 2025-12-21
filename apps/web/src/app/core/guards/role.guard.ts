import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services';
import { Role } from '@cigar-platform/types';

export const roleGuard = (allowedRoles: Role[]): CanActivateFn => {
  return (_route: ActivatedRouteSnapshot) => {
    const authService: AuthService = inject(AuthService);
    const router: Router = inject(Router);
    const user = authService.currentUser();

    if (!user) {
      return router.createUrlTree(['/auth/login']);
    }

    if (allowedRoles.includes(user.role)) {
      return true;
    }

    // User is authenticated but doesn't have the required role
    // Redirect to home
    return router.createUrlTree(['/']);
  };
};