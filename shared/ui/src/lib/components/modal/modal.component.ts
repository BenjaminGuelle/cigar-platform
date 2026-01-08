import {
  Component,
  input,
  output,
  effect,
  inject,
  TemplateRef,
  ViewChild,
  ViewContainerRef,
  ElementRef,
  ChangeDetectionStrategy,
  ViewEncapsulation,
  OnDestroy,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Overlay, OverlayModule, OverlayRef } from '@angular/cdk/overlay';
import { A11yModule } from '@angular/cdk/a11y';
import { TemplatePortal } from '@angular/cdk/portal';
import { IconDirective } from '../../directives/icon';
import { DRAWER_STATE_HANDLER, type DrawerStateHandler } from './drawer-state.token';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl';
export type ModalPosition = 'center' | 'centered' | 'top' | 'bottom' | 'right' | 'left' | 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';

// Semantic Modal Variants - Modern approach
export type ModalVariant = 'bottomSheet' | 'dialog' | 'drawer';
export type DesktopPosition = 'top-right' | 'top-left' | 'left' | 'right' | 'centered';
export type DrawerFrom = 'left' | 'right';

/**
 * Modal Component - ALL STARS Architecture ⭐ (2025/2026)
 *
 * Modern modal using CDK Overlay + Native CSS Transitions
 *
 * Features:
 * - CDK Overlay for infrastructure (positioning, backdrop, focus trap, scroll blocking)
 * - Native CSS transitions with transitionend event (no deprecated @angular/animations)
 * - Hardware-accelerated animations
 * - Tailwind CSS for styling
 * - Flexible positioning (GlobalPositionStrategy)
 *
 * Usage:
 * ```html
 * <ui-modal
 *   [isOpen]="modalOpen()"
 *   size="md"
 *   position="center"
 *   (close)="modalOpen.set(false)"
 * >
 *   <!-- Content -->
 * </ui-modal>
 * ```
 */
@Component({
  selector: 'ui-modal',
  standalone: true,
  imports: [CommonModule, OverlayModule, A11yModule, IconDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None, // Styles globaux pour atteindre .cdk-overlay-container
  styleUrls: ['./modal.component.css'],
  template: `
    <ng-template #modalTemplate>
      <div
        #modalContent
        class="modal-content"
        [class.modal-sm]="size() === 'sm'"
        [class.modal-md]="size() === 'md'"
        [class.modal-lg]="size() === 'lg'"
        [class.modal-xl]="size() === 'xl'"
        [class.modal-centered]="position() === 'centered' || variant() === 'dialog'"
        [class.modal-bottom-sheet]="variant() === 'bottomSheet'"
        [class.modal-drawer]="variant() === 'drawer'"
        [class.modal-drawer-left]="variant() === 'drawer' && drawerFrom() === 'left'"
        [class.modal-drawer-right]="variant() === 'drawer' && drawerFrom() === 'right'"
        [class.is-visible]="isVisible()"
        [class.is-dragging]="dragY() !== 0"
        [style.transform]="dragY() !== 0 ? 'translateY(' + dragY() + 'px)' : null"
        cdkTrapFocus
        [cdkTrapFocusAutoCapture]="true"
      >
        @if (isBottomAligned()) {
          <div class="modal-handle">
            <div class="modal-handle-bar"></div>
          </div>
        }

        @if (showCloseButton()) {
          <button
            type="button"
            (click)="close.emit()"
            class="modal-close-button"
            aria-label="Close modal"
          >
            <i name="x" class="w-5 h-5"></i>
          </button>
        }

        <ng-content />
      </div>
    </ng-template>
  `,
})
export class ModalComponent implements OnDestroy {
  readonly #overlay = inject(Overlay);
  readonly #viewContainerRef = inject(ViewContainerRef);

  /**
   * Optional drawer state handler for Vaul-like scale effect
   * Provided by the app via DRAWER_STATE_HANDLER token
   */
  readonly #drawerStateHandler = inject(DRAWER_STATE_HANDLER, { optional: true });

  /**
   * Unique ID for this modal instance
   * Used to track open/close state in DrawerStateService
   */
  readonly #modalId = `modal-${Math.random().toString(36).substring(2, 9)}`;

  @ViewChild('modalTemplate', { static: true }) modalTemplate!: TemplateRef<unknown>;
  @ViewChild('modalContent', { read: ElementRef }) modalContentRef?: ElementRef<HTMLElement>;

  // Inputs
  readonly isOpen = input<boolean>(false);
  readonly size = input<ModalSize>('md');

  readonly position = input<ModalPosition>('center'); // Legacy - kept for backward compatibility
  readonly variant = input<ModalVariant | undefined>(undefined); // Semantic variants (preferred)
  readonly desktopPosition = input<DesktopPosition>('centered');
  readonly drawerFrom = input<DrawerFrom>('right');

  readonly showCloseButton = input<boolean>(true);
  readonly closeOnBackdrop = input<boolean>(true);
  readonly closeOnEscape = input<boolean>(true);

  // Outputs
  readonly close = output<void>();

  // Private state
  #overlayRef?: OverlayRef;
  #transitionEndListener?: (event: TransitionEvent) => void;

  // Animation state (internal visibility for CSS transitions)
  protected readonly isVisible = signal(false);

  // Swipe-to-dismiss state
  #touchStartY = 0;
  #isDragging = false;
  protected readonly dragY = signal(0);
  #swipeCleanup?: () => void;

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        this.openModal();
      } else if (this.#overlayRef) {
        // Only close if we have an overlay (meaning we were open)
        // Notify drawer state at START of close animation (sync with modal animation)
        this.#drawerStateHandler?.close(this.#modalId);
        this.isVisible.set(false);
      }
    });

    effect(() => {
      if (this.isOpen() && this.closeOnEscape()) {
        const handleEscape = (event: KeyboardEvent): void => {
          if (event.key === 'Escape') {
            this.close.emit();
          }
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
      }
      return;
    });
  }

  ngOnDestroy(): void {
    this.removeTransitionListener();
    this.removeSwipeHandlers();
    this.detachOverlay();
  }

  /**
   * Check if modal is bottom-aligned (for mobile handle display)
   * Only shows handle for bottomSheet variant on mobile - never for drawer
   */
  protected isBottomAligned(): boolean {
    const variant = this.variant();
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    // Drawer variant never shows handle bar
    if (variant === 'drawer') {
      return false;
    }

    // Show handle for bottomSheet variant on mobile
    if (variant === 'bottomSheet' && isMobile) {
      return true;
    }

    // Dialog variant never shows handle
    if (variant === 'dialog') {
      return false;
    }

    // Legacy position-based check (only for non-variant modals)
    const pos = this.position();
    return pos === 'center' || pos === 'bottom' || pos === 'bottom-left' || pos === 'bottom-right';
  }

  /**
   * Add transitionend listener to modal content
   */
  private addTransitionListener(): void {
    if (!this.modalContentRef) return;

    this.#transitionEndListener = (event: TransitionEvent) => {
      // Only detach after closing animation (opacity transition)
      // Ignore other transitions (transform, etc.) using event bubbling check
      if (event.propertyName === 'opacity' && !this.isVisible() && event.target === this.modalContentRef?.nativeElement) {
        this.removeTransitionListener();
        this.detachOverlay();
      }
    };

    this.modalContentRef.nativeElement.addEventListener('transitionend', this.#transitionEndListener);
  }

  /**
   * Remove transitionend listener
   */
  private removeTransitionListener(): void {
    if (this.modalContentRef && this.#transitionEndListener) {
      this.modalContentRef.nativeElement.removeEventListener('transitionend', this.#transitionEndListener);
      this.#transitionEndListener = undefined;
    }
  }

  /**
   * Open modal using CDK Overlay
   */
  private openModal(): void {
    // Prevent multiple overlays
    if (this.#overlayRef?.hasAttached()) {
      return;
    }

    // Notify drawer state handler (for Vaul-like scale effect)
    this.#drawerStateHandler?.open(this.#modalId);

    // Create position strategy based on position input
    const positionStrategy = this.getPositionStrategy();

    // Create overlay with backdrop
    // Use noop() scroll strategy - scroll blocking is handled via CSS class on body
    // This prevents the position:fixed issue that causes tabbar collision
    this.#overlayRef = this.#overlay.create({
      positionStrategy,
      hasBackdrop: true,
      backdropClass: ['modal-backdrop', 'cdk-overlay-backdrop', 'modal-z-index-override'],
      panelClass: ['modal-overlay-pane', 'modal-z-index-override'],
      scrollStrategy: this.#overlay.scrollStrategies.noop(),
    });

    // Attach template portal
    const portal = new TemplatePortal(this.modalTemplate, this.#viewContainerRef);
    this.#overlayRef.attach(portal);

    // Add transition listener and trigger enter animation
    setTimeout(() => {
      this.addTransitionListener();
      this.setupSwipeHandlers();
      this.isVisible.set(true);
    }, 10);

    // Handle backdrop click
    if (this.closeOnBackdrop()) {
      this.#overlayRef.backdropClick().subscribe(() => {
        this.close.emit();
      });
    }
  }

  /**
   * Detach and dispose overlay
   * Called after leave animation completes
   * Note: drawer state close() is called in the effect at START of animation for sync
   */
  private detachOverlay(): void {
    // Fallback: close drawer state if not already closed (e.g., ngOnDestroy edge case)
    // This is a no-op if already closed since Set.delete on non-existent ID is harmless
    this.#drawerStateHandler?.close(this.#modalId);

    if (this.#overlayRef) {
      this.#overlayRef.detach();
      this.#overlayRef.dispose();
      this.#overlayRef = undefined;
    }

    // Reset swipe state
    this.dragY.set(0);
    this.removeSwipeHandlers();
  }

  private getPositionStrategy() {
    const strategy = this.#overlay.position().global();
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    const variant = this.variant();
    if (variant) {
      switch (variant) {
        case 'bottomSheet':
          if (isMobile) {
            return strategy.centerHorizontally().bottom('0');
          }
          return this.getDesktopPositionStrategy(strategy);

        case 'dialog':
          return strategy.centerHorizontally().centerVertically();

        case 'drawer':
          const drawerFrom = this.drawerFrom();
          if (drawerFrom === 'left') {
            return strategy.left('0').top('0').bottom('0');
          }
          return strategy.right('0').top('0').bottom('0');
      }
    }

    const pos = this.position();
    switch (pos) {
      case 'centered':
        return strategy.centerHorizontally().centerVertically();

      case 'top':
        if (isMobile) {
          return strategy.centerHorizontally().bottom('0');
        }
        return strategy.centerHorizontally().top('0');

      case 'bottom':
        return strategy.centerHorizontally().bottom('0');

      case 'left':
        return strategy.left('0').centerVertically();

      case 'right':
        if (isMobile) {
          return strategy.centerHorizontally().bottom('0');
        }
        return strategy.left('4rem').centerVertically();

      case 'top-left':
        return strategy.top('1rem').left('1rem');

      case 'top-right':
        return strategy.top('1rem').right('1rem');

      case 'bottom-left':
        return strategy.bottom('0').left('0');

      case 'bottom-right':
        return strategy.bottom('0').right('0');

      case 'center':
      default:
        return strategy.centerHorizontally().bottom('0');
    }
  }

  private getDesktopPositionStrategy(strategy: any) {
    const desktopPos = this.desktopPosition();

    switch (desktopPos) {
      case 'top-right':
        return strategy.top('1rem').right('1rem');

      case 'top-left':
        return strategy.top('1rem').left('1rem');

      case 'left':
        return strategy.left('4rem').centerVertically();

      case 'right':
        return strategy.right('0').centerVertically();

      case 'centered':
      default:
        return strategy.centerHorizontally().centerVertically();
    }
  }

  setupSwipeHandlers(): void {
    if (!this.modalContentRef) return;

    const element = this.modalContentRef.nativeElement;
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const isBottomSheet = this.variant() === 'bottomSheet';

    if (!isMobile || !isBottomSheet) return;

    const handleTouchStart = (e: TouchEvent) => {
      this.#touchStartY = e.touches[0].clientY;
      this.#isDragging = true;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!this.#isDragging) return;

      const currentY = e.touches[0].clientY;
      const deltaY = currentY - this.#touchStartY;

      if (deltaY > 0) {
        this.dragY.set(deltaY);
        e.preventDefault();
      } else {
        this.dragY.set(deltaY * 0.2); // Rubber band effect
      }
    };

    const handleTouchEnd = () => {
      if (!this.#isDragging) return;
      this.#isDragging = false;

      const DISMISS_THRESHOLD = 100;

      if (this.dragY() > DISMISS_THRESHOLD) {
        this.dragY.set(0);
        setTimeout(() => this.close.emit(), 0);
      } else {
        this.dragY.set(0);
      }
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd);

    this.#swipeCleanup = () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }

  private removeSwipeHandlers(): void {
    if (this.#swipeCleanup) {
      this.#swipeCleanup();
      this.#swipeCleanup = undefined;
    }
  }

}
