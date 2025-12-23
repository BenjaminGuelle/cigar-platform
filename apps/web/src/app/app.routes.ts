import { Route } from '@angular/router';
import { authGuard, adminGuard } from './core/guards';

export const appRoutes: Route[] = [
  // Auth routes (login, register, etc.)
  {
    path: 'auth',
    loadChildren: () =>
      import('./features/auth/auth.routes').then((m) => m.authRoutes),
  },

  // Admin routes (protected by adminGuard)
  {
    path: 'admin',
    canActivate: [authGuard, adminGuard],
    loadChildren: () =>
      import('./features/admin/admin.routes').then((m) => m.adminRoutes),
  },

  // Main app routes (protected by authGuard)
  {
    path: '',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/home/home.routes').then((m) => m.homeRoutes),
  },
  {
    path: 'settings',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/settings/settings.routes').then((m) => m.settingsRoutes),
  },

  // Fallback
  {
    path: '**',
    redirectTo: '',
  },
];
