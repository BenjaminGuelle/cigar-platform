import { Route } from '@angular/router';
import { HomeComponent } from './home.component';
import { adminGuard, clubContextGuard } from '../../core/guards';

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
        loadComponent: () =>
          import('./settings/settings-context.page').then((m) => m.SettingsContextPage),
      },
      // Admin routes (avec adminGuard supplémentaire)
      {
        path: 'admin',
        canActivate: [adminGuard],
        loadChildren: () =>
          import('../admin/admin.routes').then((m) => m.adminChildRoutes),
      },
      // Club routes
      {
        path: 'explore',
        loadComponent: () =>
          import('./explore/explore.page').then((m) => m.ExplorePage),
      },
      // Club public profile
      {
        path: 'club/:id',
        loadComponent: () =>
          import('../club/public/club-profile.page').then((m) => m.ClubProfilePage),
      },
      // Club internal pages (context-driven, requires club context)
      {
        path: 'membres',
        canActivate: [clubContextGuard],
        loadComponent: () =>
          import('../club/internal/members.page').then((m) => m.MembersPage),
      },
      // TODO: Add more features here (degustations, evenements, notifications, etc.)
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