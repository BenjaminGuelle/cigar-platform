import { Route } from '@angular/router';

export const settingsRoutes: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('./settings.component').then((m) => m.SettingsComponent),
  },
];