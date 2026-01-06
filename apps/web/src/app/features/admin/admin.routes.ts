import { Route } from '@angular/router';

/**
 * Admin Routes (Children only) - All Stars Architecture 🌟
 * Routes admin (sans wrapper layout)
 * Le layout HomeComponent est défini dans app.routes.ts
 * La sub-sidebar admin est gérée automatiquement via la route
 */
export const adminChildRoutes: Route[] = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./dashboard/dashboard.component').then((m) => m.DashboardComponent),
  },
  {
    path: 'users',
    loadComponent: () =>
      import('./users/users.component').then((m) => m.UsersComponent),
  },
  {
    path: 'config',
    loadComponent: () =>
      import('./config/config.component').then((m) => m.ConfigComponent),
  },
  {
    path: 'stats',
    loadComponent: () =>
      import('./stats/stats.component').then((m) => m.StatsComponent),
  },
  {
    path: 'security',
    loadComponent: () =>
      import('./security/security.component').then((m) => m.SecurityComponent),
  },
  {
    path: 'feedbacks',
    loadComponent: () =>
      import('./feedbacks/feedbacks.component').then((m) => m.FeedbacksComponent),
  },
  {
    path: 'analytics',
    loadComponent: () =>
      import('./analytics/analytics.component').then((m) => m.AnalyticsComponent),
  },
];