import {
  Injectable,
  signal,
  computed,
  effect,
  inject,
  PLATFORM_ID,
  DestroyRef,
  type Signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { Observable, fromEvent, map, startWith, distinctUntilChanged } from 'rxjs';

import {
  BREAKPOINT_MD,
  BREAKPOINT_LG,
  BREAKPOINTS,
  type BreakpointKey,
} from '../tokens/breakpoints';
import {
  SIDEBAR_WIDTH,
  MOBILE_HEADER_HEIGHT,
  DESKTOP_HEADER_HEIGHT,
  MOBILE_TAB_BAR_HEIGHT,
} from '../tokens/spacing';

/**
 * Platform type detected from user agent
 */
export type Platform = 'ios' | 'android' | 'desktop' | 'unknown';

/**
 * Display mode (standalone = PWA installed)
 */
export type DisplayMode = 'browser' | 'standalone';

/**
 * Layout Service
 *
 * Single source of truth for responsive layout state.
 * Provides reactive signals for breakpoints, platform detection, and safe areas.
 *
 * @example
 * ```typescript
 * @Component({...})
 * export class MyComponent {
 *   private layout = inject(LayoutService);
 *
 *   // Reactive breakpoint detection
 *   isMobile = this.layout.isMobile;
 *   isDesktop = this.layout.isDesktop;
 *
 *   // Platform-specific logic
 *   isIOS = computed(() => this.layout.platform() === 'ios');
 *
 *   // Get layout dimensions
 *   headerHeight = this.layout.headerHeight;
 * }
 * ```
 */
@Injectable({
  providedIn: 'root',
})
export class LayoutService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  // ==========================================================================
  // WINDOW SIZE (reactive)
  // ==========================================================================

  /**
   * Current window width in pixels
   */
  readonly windowWidth: Signal<number>;

  /**
   * Current window height in pixels
   */
  readonly windowHeight: Signal<number>;

  // ==========================================================================
  // BREAKPOINT SIGNALS
  // ==========================================================================

  /**
   * True if window width < md breakpoint (768px)
   * Use for mobile-specific logic
   */
  readonly isMobile: Signal<boolean>;

  /**
   * True if window width >= md breakpoint (768px)
   * Use for desktop-specific logic
   */
  readonly isDesktop: Signal<boolean>;

  /**
   * True if window width >= lg breakpoint (1024px)
   * Use for large screen optimizations
   */
  readonly isLargeScreen: Signal<boolean>;

  /**
   * Current active breakpoint key
   */
  readonly activeBreakpoint: Signal<BreakpointKey>;

  // ==========================================================================
  // PLATFORM DETECTION
  // ==========================================================================

  /**
   * Detected platform (ios, android, desktop, unknown)
   */
  readonly platform: Signal<Platform>;

  /**
   * True if running as installed PWA
   */
  readonly isStandalone: Signal<boolean>;

  /**
   * Display mode (browser or standalone)
   */
  readonly displayMode: Signal<DisplayMode>;

  // ==========================================================================
  // LAYOUT DIMENSIONS (computed based on breakpoint)
  // ==========================================================================

  /**
   * Current header height in pixels (includes safe area awareness)
   */
  readonly headerHeight: Signal<number>;

  /**
   * Current sidebar width (0 on mobile, SIDEBAR_WIDTH on desktop)
   */
  readonly sidebarWidth: Signal<number>;

  /**
   * Current tab bar height (MOBILE_TAB_BAR_HEIGHT on mobile, 0 on desktop)
   */
  readonly tabBarHeight: Signal<number>;

  // ==========================================================================
  // CONSTRUCTOR
  // ==========================================================================

  constructor() {
    if (this.isBrowser) {
      // Window size from resize events
      const resize$ = fromEvent(window, 'resize').pipe(
        map(() => ({ width: window.innerWidth, height: window.innerHeight })),
        startWith({ width: window.innerWidth, height: window.innerHeight }),
        distinctUntilChanged((a, b) => a.width === b.width && a.height === b.height)
      );

      const windowSize = toSignal(resize$, {
        initialValue: { width: window.innerWidth, height: window.innerHeight },
      });

      this.windowWidth = computed(() => windowSize().width);
      this.windowHeight = computed(() => windowSize().height);

      // Platform detection (one-time on init)
      this.platform = signal(this.detectPlatform());

      // Display mode (reactive to changes)
      const displayMode$ = this.createDisplayModeObservable();
      this.displayMode = toSignal(displayMode$, { initialValue: this.getDisplayMode() });
      this.isStandalone = computed(() => this.displayMode() === 'standalone');
    } else {
      // SSR fallback - assume desktop
      this.windowWidth = signal(1024);
      this.windowHeight = signal(768);
      this.platform = signal('desktop');
      this.displayMode = signal('browser');
      this.isStandalone = signal(false);
    }

    // Breakpoint computations
    this.isMobile = computed(() => this.windowWidth() < BREAKPOINT_MD);
    this.isDesktop = computed(() => this.windowWidth() >= BREAKPOINT_MD);
    this.isLargeScreen = computed(() => this.windowWidth() >= BREAKPOINT_LG);
    this.activeBreakpoint = computed(() => this.computeActiveBreakpoint());

    // Layout dimensions
    this.headerHeight = computed(() =>
      this.isMobile() ? MOBILE_HEADER_HEIGHT : DESKTOP_HEADER_HEIGHT
    );
    this.sidebarWidth = computed(() => (this.isDesktop() ? SIDEBAR_WIDTH : 0));
    this.tabBarHeight = computed(() => (this.isMobile() ? MOBILE_TAB_BAR_HEIGHT : 0));
  }

  // ==========================================================================
  // PUBLIC METHODS
  // ==========================================================================

  /**
   * Check if current width matches or exceeds a breakpoint
   *
   * @param breakpoint - Breakpoint key to check
   * @returns true if window width >= breakpoint value
   *
   * @example
   * ```typescript
   * if (layout.matchesBreakpoint('lg')) {
   *   // Large screen logic
   * }
   * ```
   */
  matchesBreakpoint(breakpoint: BreakpointKey): boolean {
    return this.windowWidth() >= BREAKPOINTS[breakpoint];
  }

  /**
   * Check if platform is iOS
   */
  isIOS(): boolean {
    return this.platform() === 'ios';
  }

  /**
   * Check if platform is Android
   */
  isAndroid(): boolean {
    return this.platform() === 'android';
  }

  /**
   * Check if platform is mobile (iOS or Android)
   */
  isMobilePlatform(): boolean {
    const p = this.platform();
    return p === 'ios' || p === 'android';
  }

  // ==========================================================================
  // PRIVATE METHODS
  // ==========================================================================

  /**
   * Detect platform from user agent
   */
  private detectPlatform(): Platform {
    if (!this.isBrowser) return 'desktop';

    const ua = navigator.userAgent.toLowerCase();

    if (/iphone|ipad|ipod/.test(ua)) {
      return 'ios';
    }

    if (/android/.test(ua)) {
      return 'android';
    }

    if (/windows|macintosh|linux/.test(ua) && !/mobile/.test(ua)) {
      return 'desktop';
    }

    return 'unknown';
  }

  /**
   * Get current display mode
   */
  private getDisplayMode(): DisplayMode {
    if (!this.isBrowser) return 'browser';

    // Check for standalone PWA
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

    return isStandalone ? 'standalone' : 'browser';
  }

  /**
   * Create observable for display mode changes
   */
  private createDisplayModeObservable() {
    if (!this.isBrowser) {
      // Return an observable that never emits for SSR
      return new Observable<DisplayMode>((subscriber) => {
        subscriber.next('browser');
      });
    }

    const mediaQuery = window.matchMedia('(display-mode: standalone)');

    return new Observable<DisplayMode>((subscriber) => {
      // Emit initial value
      subscriber.next(this.getDisplayMode());

      // Listen for changes
      const handler = (event: MediaQueryListEvent): void => {
        subscriber.next(event.matches ? 'standalone' : 'browser');
      };

      mediaQuery.addEventListener('change', handler);

      // Cleanup
      return () => {
        mediaQuery.removeEventListener('change', handler);
      };
    });
  }

  /**
   * Compute active breakpoint from window width
   */
  private computeActiveBreakpoint(): BreakpointKey {
    const width = this.windowWidth();

    if (width >= BREAKPOINTS['2xl']) return '2xl';
    if (width >= BREAKPOINTS.xl) return 'xl';
    if (width >= BREAKPOINTS.lg) return 'lg';
    if (width >= BREAKPOINTS.md) return 'md';
    return 'sm';
  }
}