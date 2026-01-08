import { Directive, inject, effect, ElementRef, Renderer2 } from '@angular/core';
import { DrawerStateService } from '../../core/services';

/**
 * VaulWrapperDirective - Vaul-like Scale Effect for Angular
 *
 * Apply this directive to the main content wrapper.
 * When any drawer/modal/bottomsheet opens, the content will:
 * - Scale down to 0.96 (creates depth effect)
 * - Add border-radius (rounded corners)
 * - Smooth spring animation
 *
 * This pattern is used by Linear, Vercel, Raycast, etc.
 *
 * Benefits:
 * - No body scroll blocking (no position:fixed issues)
 * - No tabbar collision/jump
 * - Premium depth effect
 * - GPU-accelerated (transform-based)
 *
 * @example
 * ```html
 * <div class="min-h-screen" vaulDrawerWrapper>
 *   <!-- Main content here -->
 * </div>
 * ```
 */
@Directive({
  selector: '[vaulDrawerWrapper]',
  standalone: true,
})
export class VaulWrapperDirective {
  readonly #drawerState = inject(DrawerStateService);
  readonly #elementRef = inject(ElementRef<HTMLElement>);
  readonly #renderer = inject(Renderer2);

  constructor() {
    // Apply base styles for smooth transitions
    this.#applyBaseStyles();

    // React to drawer state changes
    effect(() => {
      const isOpen = this.#drawerState.isAnyOpen();
      this.#updateTransform(isOpen);
    });
  }

  /**
   * Apply base CSS for the wrapper element
   * These styles enable smooth transitions and proper transform origin
   *
   * NOTE: We do NOT apply will-change: transform here because it creates
   * a new containing block, breaking position: fixed for children (like
   * the explore page search header). Modern browsers handle transform
   * optimization automatically.
   */
  #applyBaseStyles(): void {
    const el = this.#elementRef.nativeElement;

    // Transform origin at top center for natural scale effect
    this.#renderer.setStyle(el, 'transformOrigin', 'top center');

    // Spring animation timing (matches Vaul)
    this.#renderer.setStyle(
      el,
      'transition',
      'transform 0.5s cubic-bezier(0.32, 0.72, 0, 1), border-radius 0.5s cubic-bezier(0.32, 0.72, 0, 1)'
    );
  }

  /**
   * Update transform based on drawer open state
   */
  #updateTransform(isOpen: boolean): void {
    const el = this.#elementRef.nativeElement;

    if (isOpen) {
      // Scale down + add border-radius (Vaul effect)
      // Scale: 0.96 = (window.innerWidth - 40) / window.innerWidth approx
      this.#renderer.setStyle(el, 'transform', 'scale(0.96)');
      this.#renderer.setStyle(el, 'borderRadius', '8px');

      // Prevent content from being interactive while drawer is open
      this.#renderer.setStyle(el, 'pointerEvents', 'none');

      // Add class for additional CSS targeting if needed
      this.#renderer.addClass(el, 'vaul-scaled');
    } else {
      // Reset to normal - use 'none' not 'scale(1)' to avoid creating containing block
      // Any transform value (even identity) breaks position: fixed for children
      this.#renderer.setStyle(el, 'transform', 'none');
      this.#renderer.setStyle(el, 'borderRadius', '0');
      this.#renderer.setStyle(el, 'pointerEvents', 'auto');
      this.#renderer.removeClass(el, 'vaul-scaled');
    }
  }
}