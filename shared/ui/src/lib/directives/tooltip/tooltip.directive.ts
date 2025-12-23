import { Directive, input, ElementRef, Renderer2, inject, effect, OnDestroy } from '@angular/core';

export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

@Directive({
  selector: '[uiTooltip]',
  standalone: true,
})
export class TooltipDirective implements OnDestroy {
  readonly uiTooltip = input<string>('');
  readonly tooltipPosition = input<TooltipPosition>('right');
  readonly tooltipDelay = input<number>(200);

  readonly #el: ElementRef = inject(ElementRef);
  readonly #renderer: Renderer2 = inject(Renderer2);

  #tooltipElement: HTMLElement | null = null;
  #showTimeout: ReturnType<typeof setTimeout> | null = null;
  #hideTimeout: ReturnType<typeof setTimeout> | null = null;
  #mouseEnterListener: (() => void) | null = null;
  #mouseLeaveListener: (() => void) | null = null;

  constructor() {
    effect(() => {
      const tooltipText = this.uiTooltip();

      // Cleanup existing listeners
      this.#removeListeners();

      if (tooltipText) {
        this.#setupListeners();
      }
    });
  }

  #setupListeners(): void {
    this.#mouseEnterListener = this.#renderer.listen(
      this.#el.nativeElement,
      'mouseenter',
      () => this.#show()
    );

    this.#mouseLeaveListener = this.#renderer.listen(
      this.#el.nativeElement,
      'mouseleave',
      () => this.#hide()
    );
  }

  #removeListeners(): void {
    if (this.#mouseEnterListener) {
      this.#mouseEnterListener();
      this.#mouseEnterListener = null;
    }

    if (this.#mouseLeaveListener) {
      this.#mouseLeaveListener();
      this.#mouseLeaveListener = null;
    }
  }

  #show(): void {
    // Clear any pending hide
    if (this.#hideTimeout) {
      clearTimeout(this.#hideTimeout);
      this.#hideTimeout = null;
    }

    // Set delay before showing
    this.#showTimeout = setTimeout(() => {
      this.#createTooltip();
    }, this.tooltipDelay());
  }

  #hide(): void {
    // Clear any pending show
    if (this.#showTimeout) {
      clearTimeout(this.#showTimeout);
      this.#showTimeout = null;
    }

    // Immediate hide with fade out
    if (this.#tooltipElement) {
      this.#renderer.setStyle(this.#tooltipElement, 'opacity', '0');

      this.#hideTimeout = setTimeout(() => {
        this.#destroyTooltip();
      }, 150);
    }
  }

  #createTooltip(): void {
    if (this.#tooltipElement) {
      return;
    }

    const tooltipText = this.uiTooltip();
    if (!tooltipText) {
      return;
    }

    // Create tooltip element
    this.#tooltipElement = this.#renderer.createElement('div');
    this.#renderer.appendChild(this.#tooltipElement, this.#renderer.createText(tooltipText));

    // Base styles
    this.#renderer.setStyle(this.#tooltipElement, 'position', 'fixed');
    this.#renderer.setStyle(this.#tooltipElement, 'z-index', '9999');
    this.#renderer.setStyle(this.#tooltipElement, 'padding', '0.5rem 0.75rem');
    this.#renderer.setStyle(this.#tooltipElement, 'background', 'rgb(28, 25, 23)'); // smoke-800
    this.#renderer.setStyle(this.#tooltipElement, 'color', 'rgb(250, 250, 249)'); // smoke-50
    this.#renderer.setStyle(this.#tooltipElement, 'border-radius', '0.5rem');
    this.#renderer.setStyle(this.#tooltipElement, 'font-size', '0.875rem');
    this.#renderer.setStyle(this.#tooltipElement, 'font-weight', '500');
    this.#renderer.setStyle(this.#tooltipElement, 'white-space', 'nowrap');
    this.#renderer.setStyle(this.#tooltipElement, 'pointer-events', 'none');
    this.#renderer.setStyle(this.#tooltipElement, 'border', '1px solid rgba(217, 191, 128, 0.3)'); // gold-500/30
    this.#renderer.setStyle(this.#tooltipElement, 'box-shadow', '0 4px 12px rgba(217, 191, 128, 0.1)'); // gold-500/10
    this.#renderer.setStyle(this.#tooltipElement, 'opacity', '0');
    this.#renderer.setStyle(this.#tooltipElement, 'transition', 'opacity 150ms ease-in-out');

    // Append to body
    this.#renderer.appendChild(document.body, this.#tooltipElement);

    // Position tooltip
    this.#positionTooltip();

    // Fade in
    setTimeout(() => {
      if (this.#tooltipElement) {
        this.#renderer.setStyle(this.#tooltipElement, 'opacity', '1');
      }
    }, 10);
  }

  #positionTooltip(): void {
    if (!this.#tooltipElement) {
      return;
    }

    const hostRect = this.#el.nativeElement.getBoundingClientRect();
    const tooltipRect = this.#tooltipElement.getBoundingClientRect();
    const gap = 8;

    let top = 0;
    let left = 0;

    switch (this.tooltipPosition()) {
      case 'right':
        top = hostRect.top + (hostRect.height - tooltipRect.height) / 2;
        left = hostRect.right + gap;
        break;
      case 'left':
        top = hostRect.top + (hostRect.height - tooltipRect.height) / 2;
        left = hostRect.left - tooltipRect.width - gap;
        break;
      case 'top':
        top = hostRect.top - tooltipRect.height - gap;
        left = hostRect.left + (hostRect.width - tooltipRect.width) / 2;
        break;
      case 'bottom':
        top = hostRect.bottom + gap;
        left = hostRect.left + (hostRect.width - tooltipRect.width) / 2;
        break;
    }

    this.#renderer.setStyle(this.#tooltipElement, 'top', `${top}px`);
    this.#renderer.setStyle(this.#tooltipElement, 'left', `${left}px`);
  }

  #destroyTooltip(): void {
    if (this.#tooltipElement) {
      this.#renderer.removeChild(document.body, this.#tooltipElement);
      this.#tooltipElement = null;
    }
  }

  ngOnDestroy(): void {
    this.#removeListeners();
    this.#destroyTooltip();

    if (this.#showTimeout) {
      clearTimeout(this.#showTimeout);
    }

    if (this.#hideTimeout) {
      clearTimeout(this.#hideTimeout);
    }
  }
}
