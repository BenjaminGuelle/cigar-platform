import { Route } from '@angular/router';
import { adminGuard } from '../../core/guards';

export const adminRoutes: Route[] = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'dashboard',
  },
  {
    path: 'dashboard',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./dashboard/dashboard.component').then((m) => m.DashboardComponent),
  },
  {
    path: 'users',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./users/users.component').then((m) => m.UsersComponent),
  },
  {
    path: 'config',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./config/config.component').then((m) => m.ConfigComponent),
  },
  {
    path: 'stats',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./stats/stats.component').then((m) => m.StatsComponent),
  },
  {
    path: 'security',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./security/security.component').then((m) => m.SecurityComponent),
  },
];