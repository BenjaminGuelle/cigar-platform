import { Route } from '@angular/router';
import { HomeComponent } from './home.component';
import { adminGuard } from '../../core/guards';

/**
 * Home Routes - All Stars Architecture 🌟 (Single Layout Instance)
 * Layout principal (HomeComponent) + toutes les features de l'app (app + admin)
 * Une seule instance pour des animations smooth entre routes
 */
export const homeRoutes: Route[] = [
  {
    path: '',
    component: HomeComponent, // Layout unique (sidebar + router-outlet)
    children: [
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
        path: 'settings',
        loadChildren: () =>
          import('./settings/settings.routes').then((m) => m.settingsRoutes),
      },
      // Admin routes (avec adminGuard supplémentaire)
      {
        path: 'admin',
        canActivate: [adminGuard],
        loadChildren: () =>
          import('../admin/admin.routes').then((m) => m.adminChildRoutes),
      },
      // TODO: Add more features here (clubs, degustations, evenements, notifications, etc.)
      // {
      //   path: 'clubs',
      //   loadChildren: () => import('./clubs/clubs.routes').then(m => m.clubsRoutes),
      // },
      // Catch-all: redirect unknown routes to dashboard
      {
        path: '**',
        redirectTo: 'dashboard',
      },
    ],
  },
];