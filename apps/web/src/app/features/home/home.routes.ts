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
        path: 'profile',
        loadComponent: () =>
          import('./profile/profile-context.page').then((m) => m.ProfileContextPage),
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
      // Explore route (TECHNICAL FALLBACK ONLY - Not in primary navigation)
      // Product Decision: Discovery = Global Search Modal (search icon + cmd+K)
      // This route auto-opens search modal on mount, keeps minimal browse UI as fallback
      // Use case: Deep-links from external sources (/explore URL sharing)
      {
        path: 'explore',
        loadComponent: () =>
          import('./explore/explore.page').then((m) => m.ExplorePage),
      },
      // Club profile (Prestige URL: /club/slug) - Unified component
      {
        path: 'club/:slug',
        loadComponent: () =>
          import('./profile/club/club-profile.page').then((m) => m.ClubProfilePage),
      },
      // User profile (Prestige URL: /user/@username) - Unified component
      {
        path: 'user/:username',
        loadComponent: () =>
          import('./profile/user/user-profile.page').then((m) => m.UserProfilePage),
      },
      // Cigar public profile (Prestige URL: /cigar/slug)
      {
        path: 'cigar/:slug',
        loadComponent: () =>
          import('../cigar/public/cigar-profile.page').then((m) => m.CigarProfilePage),
      },
      // Tasting routes (mode focus - fullscreen experience)
      {
        path: 'tasting',
        loadChildren: () =>
          import('../tasting/tasting.routes').then((m) => m.tastingRoutes),
      },
      // Tastings routes (list and view)
      {
        path: 'tastings',
        loadChildren: () =>
          import('../tastings/tastings.routes').then((m) => m.tastingsRoutes),
      },
      // Club internal pages (context-driven, requires club context)
      {
        path: 'membres',
        canActivate: [clubContextGuard],
        loadComponent: () =>
          import('./profile/club/members.page').then((m) => m.MembersPage),
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