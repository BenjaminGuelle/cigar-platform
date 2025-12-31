import { Route } from '@angular/router';

/**
 * Tasting Routes
 * Full-screen mode focus experience for cigar tasting
 */
export const tastingRoutes: Route[] = [
  {
    path: 'new',
    loadComponent: () =>
      import('./pages/tasting-page/tasting-page.component').then(
        (m) => m.TastingPageComponent
      ),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/tasting-page/tasting-page.component').then(
        (m) => m.TastingPageComponent
      ),
  },
];
