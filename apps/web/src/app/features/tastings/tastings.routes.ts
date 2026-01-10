import { Route } from '@angular/router';

/**
 * Tastings Routes
 * View individual tasting details
 */
export const tastingsRoutes: Route[] = [
  {
    path: '',
    redirectTo: '/profile',
    pathMatch: 'full',
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/tasting-view.page').then((m) => m.TastingViewPage),
  },
];