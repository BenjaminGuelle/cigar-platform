import { Route } from '@angular/router';

/**
 * Tastings Routes
 * List and view completed tastings
 */
export const tastingsRoutes: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/tastings-list.page').then((m) => m.TastingsListPage),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/tasting-view.page').then((m) => m.TastingViewPage),
  },
];