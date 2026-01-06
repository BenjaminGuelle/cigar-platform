import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AnalyticsService as AnalyticsApiService } from '@cigar-platform/types/lib/analytics/analytics.service';
import { PwaService } from './pwa.service';

/**
 * Analytics Tracking Service
 *
 * Fire-and-forget service for tracking user events.
 * Automatically collects platform metadata.
 *
 * @example
 * ```typescript
 * @Component({...})
 * export class MyComponent {
 *   private analytics = inject(AnalyticsTrackingService);
 *
 *   onTastingComplete() {
 *     this.analytics.track('tasting_completed', { cigarId: '123', rating: 4.5 });
 *   }
 * }
 * ```
 */
@Injectable({ providedIn: 'root' })
export class AnalyticsTrackingService {
  readonly #platformId = inject(PLATFORM_ID);
  readonly #analyticsApi = inject(AnalyticsApiService);
  readonly #pwaService = inject(PwaService);

  /**
   * Track an analytics event (fire-and-forget)
   *
   * @param event - Event name (e.g., 'tasting_started', 'pwa_installed')
   * @param data - Optional event-specific data
   */
  track(event: string, data?: Record<string, unknown>): void {
    if (!isPlatformBrowser(this.#platformId)) return;

    const page = window.location.pathname;
    const platform = this.#pwaService.platform();
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    // Fire and forget - don't await, don't handle errors
    this.#analyticsApi
      .analyticsControllerTrack({
        event,
        data,
        page,
        platform: platform ?? undefined,
        screenWidth,
        screenHeight,
      })
      .catch(() => {
        // Silent fail - analytics should never break the app
      });
  }
}
