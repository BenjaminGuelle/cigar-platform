import { Route } from '@angular/router';
import { authGuard } from './core/guards';

/**
 * App Routes - All Stars Architecture 🌟 (Single Layout Instance)
 *
 * Architecture:
 * - Auth routes: Public
 * - Home routes: Une seule instance de HomeComponent contenant app + admin
 *
 * Avantages:
 * - Une seule instance de HomeComponent = animations smooth entre routes
 * - State préservé pendant navigation app <-> admin
 * - Sub-sidebar reste en vie pendant les transitions
 */
export const appRoutes: Route[] = [
  // Auth routes (public)
  {
    path: 'auth',
    loadChildren: () =>
      import('./features/auth/auth.routes').then((m) => m.authRoutes),
  },

  // Home routes (protected: authGuard) - Layout + Features (app + admin)
  {
    path: '',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/home/home.routes').then((m) => m.homeRoutes),
  },
];
