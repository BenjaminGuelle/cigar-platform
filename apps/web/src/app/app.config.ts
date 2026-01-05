import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideAppInitializer,
  inject,
  LOCALE_ID,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { appRoutes } from './app.routes';
import { authInterceptor, errorInterceptor } from './core/interceptors';
import { ContextStore } from './core/stores/context.store';

// Register French locale
registerLocaleData(localeFr);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(appRoutes),
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
    { provide: LOCALE_ID, useValue: 'fr-FR' },
    provideAppInitializer(() => {
      const contextStore = inject(ContextStore);
      return contextStore.initializeContext();
    }),
  ],
};
