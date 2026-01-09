import {
  Directive,
  ElementRef,
  inject,
  input,
  output,
  OnInit,
  OnDestroy,
  Renderer2,
  NgZone,
} from '@angular/core';
import { QueryCacheService } from '../../core/query';
import { LayoutService } from '../../core/layout';

/**
 * Pull to Refresh Directive
 * Custom swipe-to-refresh that invalidates query cache
 * Instead of reloading the page (like native PTR), refreshes data
 *
 * Usage:
 * <div appPullToRefresh [queryKeys]="[['dashboard'], ['user']]">
 *   <!-- Scrollable content -->
 * </div>
 */
@Directive({
  selector: '[appPullToRefresh]',
  standalone: true,
})
export class PullToRefreshDirective implements OnInit, OnDestroy {
  private readonly el = inject(ElementRef);
  private readonly renderer = inject(Renderer2);
  private readonly ngZone = inject(NgZone);
  private readonly queryCache = inject(QueryCacheService);
  private readonly layout = inject(LayoutService);

  /**
   * Query keys to invalidate on refresh
   * Each key is an array (matching QueryCacheService pattern)
   * If empty, invalidates all queries via clear()
   */
  readonly queryKeys = input<unknown[][]>([]);

  /**
   * Pull threshold in pixels to trigger refresh
   */
  readonly threshold = input<number>(80);

  /**
   * Whether the directive is enabled
   */
  readonly enabled = input<boolean>(true);

  /**
   * Emitted when refresh is triggered
   */
  readonly refreshed = output<void>();

  private startY = 0;
  private currentY = 0;
  private isPulling = false;
  private indicatorElement: HTMLElement | null = null;

  // Bound event handlers for proper cleanup
  private boundTouchStart!: (e: TouchEvent) => void;
  private boundTouchMove!: (e: TouchEvent) => void;
  private boundTouchEnd!: (e: TouchEvent) => void;

  ngOnInit(): void {
    this.createIndicator();
    this.bindEvents();
  }

  ngOnDestroy(): void {
    this.unbindEvents();
    this.removeIndicator();
  }

  private createIndicator(): void {
    this.indicatorElement = this.renderer.createElement('div');
    this.renderer.addClass(this.indicatorElement, 'ptr-indicator');
    this.renderer.setStyle(this.indicatorElement, 'position', 'fixed');
    this.renderer.setStyle(this.indicatorElement, 'top', '0');
    this.renderer.setStyle(this.indicatorElement, 'left', '50%');
    this.renderer.setStyle(this.indicatorElement, 'transform', 'translateX(-50%) translateY(-100%)');
    this.renderer.setStyle(this.indicatorElement, 'width', '40px');
    this.renderer.setStyle(this.indicatorElement, 'height', '40px');
    this.renderer.setStyle(this.indicatorElement, 'borderRadius', '50%');
    this.renderer.setStyle(this.indicatorElement, 'backgroundColor', 'rgba(212, 175, 55, 0.2)');
    this.renderer.setStyle(this.indicatorElement, 'border', '2px solid #d4af37');
    this.renderer.setStyle(this.indicatorElement, 'display', 'flex');
    this.renderer.setStyle(this.indicatorElement, 'alignItems', 'center');
    this.renderer.setStyle(this.indicatorElement, 'justifyContent', 'center');
    this.renderer.setStyle(this.indicatorElement, 'zIndex', '9999');
    this.renderer.setStyle(this.indicatorElement, 'opacity', '0');
    this.renderer.setStyle(this.indicatorElement, 'transition', 'opacity 0.2s, transform 0.2s');
    this.renderer.setStyle(this.indicatorElement, 'pointerEvents', 'none');

    // Add arrow icon
    const arrow = this.renderer.createElement('span');
    this.renderer.setProperty(arrow, 'innerHTML', '↓');
    this.renderer.setStyle(arrow, 'color', '#d4af37');
    this.renderer.setStyle(arrow, 'fontSize', '18px');
    this.renderer.setStyle(arrow, 'fontWeight', 'bold');
    this.renderer.setStyle(arrow, 'transition', 'transform 0.2s');
    this.renderer.appendChild(this.indicatorElement, arrow);

    this.renderer.appendChild(document.body, this.indicatorElement);
  }

  private removeIndicator(): void {
    if (this.indicatorElement && this.indicatorElement.parentNode) {
      this.renderer.removeChild(document.body, this.indicatorElement);
    }
  }

  private bindEvents(): void {
    this.ngZone.runOutsideAngular(() => {
      this.boundTouchStart = this.onTouchStart.bind(this);
      this.boundTouchMove = this.onTouchMove.bind(this);
      this.boundTouchEnd = this.onTouchEnd.bind(this);

      const element = this.el.nativeElement;
      element.addEventListener('touchstart', this.boundTouchStart, { passive: true });
      element.addEventListener('touchmove', this.boundTouchMove, { passive: false });
      element.addEventListener('touchend', this.boundTouchEnd, { passive: true });
    });
  }

  private unbindEvents(): void {
    const element = this.el.nativeElement;
    element.removeEventListener('touchstart', this.boundTouchStart);
    element.removeEventListener('touchmove', this.boundTouchMove);
    element.removeEventListener('touchend', this.boundTouchEnd);
  }

  private onTouchStart(e: TouchEvent): void {
    if (!this.enabled() || !this.isMobile()) return;

    // Only trigger if at the top of scroll
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    if (scrollTop > 5) return;

    this.startY = e.touches[0].clientY;
    this.isPulling = true;
  }

  private onTouchMove(e: TouchEvent): void {
    if (!this.isPulling || !this.enabled()) return;

    this.currentY = e.touches[0].clientY;
    const pullDistance = this.currentY - this.startY;

    // Only handle downward pulls
    if (pullDistance <= 0) {
      this.hideIndicator();
      return;
    }

    // Prevent default scroll when pulling
    if (pullDistance > 10) {
      e.preventDefault();
    }

    // Update indicator
    this.updateIndicator(pullDistance);
  }

  private onTouchEnd(): void {
    if (!this.isPulling) return;

    const pullDistance = this.currentY - this.startY;

    if (pullDistance >= this.threshold()) {
      this.ngZone.run(() => {
        this.triggerRefresh();
      });
    }

    this.isPulling = false;
    this.hideIndicator();
  }

  private updateIndicator(distance: number): void {
    if (!this.indicatorElement) return;

    const progress = Math.min(distance / this.threshold(), 1);
    const translateY = Math.min(distance * 0.5, 60);

    this.renderer.setStyle(this.indicatorElement, 'opacity', String(progress));
    this.renderer.setStyle(
      this.indicatorElement,
      'transform',
      `translateX(-50%) translateY(${translateY}px)`
    );

    // Rotate arrow when threshold reached
    const arrow = this.indicatorElement.firstChild as HTMLElement;
    if (arrow) {
      const rotation = progress >= 1 ? 180 : 0;
      this.renderer.setStyle(arrow, 'transform', `rotate(${rotation}deg)`);
    }

    // Add glow effect when threshold reached
    if (progress >= 1) {
      this.renderer.setStyle(
        this.indicatorElement,
        'boxShadow',
        '0 0 20px rgba(212, 175, 55, 0.5)'
      );
    } else {
      this.renderer.setStyle(this.indicatorElement, 'boxShadow', 'none');
    }
  }

  private hideIndicator(): void {
    if (!this.indicatorElement) return;

    this.renderer.setStyle(this.indicatorElement, 'opacity', '0');
    this.renderer.setStyle(
      this.indicatorElement,
      'transform',
      'translateX(-50%) translateY(-100%)'
    );
    this.renderer.setStyle(this.indicatorElement, 'boxShadow', 'none');
  }

  /**
   * Trigger refresh using ALL STARS pattern
   * - Background refetch (data stays visible)
   * - Never clears data
   * - Waits for refetch to complete before hiding indicator
   */
  private async triggerRefresh(): Promise<void> {
    // Show loading state
    if (this.indicatorElement) {
      const arrow = this.indicatorElement.firstChild as HTMLElement;
      if (arrow) {
        this.renderer.setProperty(arrow, 'innerHTML', '⟳');
        this.renderer.setStyle(arrow, 'animation', 'spin 1s linear infinite');
      }
      this.renderer.setStyle(this.indicatorElement, 'opacity', '1');
      this.renderer.setStyle(
        this.indicatorElement,
        'transform',
        'translateX(-50%) translateY(20px)'
      );
    }

    // Refresh all active queries (TanStack Query pattern)
    // - Active queries: refetch in background (data stays visible)
    // - Inactive queries: just mark stale (lazy refetch on next use)
    // NEVER clears data - keeps UI responsive during refresh
    await this.queryCache.refreshActiveQueries();

    // Emit event
    this.refreshed.emit();

    // Hide indicator after refresh completes
    this.hideIndicator();
  }

  /**
   * Check if current viewport is mobile
   * Uses centralized LayoutService for consistent breakpoint detection
   */
  private isMobile(): boolean {
    return this.layout.isMobile();
  }
}