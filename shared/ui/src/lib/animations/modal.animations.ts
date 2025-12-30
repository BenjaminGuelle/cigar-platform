import {
  trigger,
  state,
  style,
  transition,
  animate,
  AnimationTriggerMetadata,
} from '@angular/animations';

/**
 * Modal Animations - ALL STARS ⭐
 * Professional animations for CDK Overlay modals
 *
 * Animations:
 * - slideUp: Bottom to center (mobile bottom sheet style)
 * - slideDown: Top to center
 * - slideLeft: Right to center
 * - slideRight: Left to center
 * - fade: Opacity only
 * - scale: Scale with fade
 *
 * Usage:
 * @Component({
 *   animations: [modalSlideUp, backdropFade]
 * })
 */

const ANIMATION_TIMINGS = {
  enter: '350ms cubic-bezier(0.16, 1, 0.3, 1)', // Smooth easing in
  leave: '250ms cubic-bezier(0.5, 0, 0.75, 0)', // Quick easing out
};

/**
 * Slide Up Animation (Bottom Sheet Style)
 * Mobile: slides from bottom
 * Desktop: can be used for bottom-aligned modals
 */
export const modalSlideUp: AnimationTriggerMetadata = trigger('slideUp', [
  state('void', style({
    opacity: 0,
    transform: 'translateY(100%)',
  })),
  state('enter', style({
    opacity: 1,
    transform: 'translateY(0)',
  })),
  transition('void => enter', animate(ANIMATION_TIMINGS.enter)),
  transition('enter => void', animate(ANIMATION_TIMINGS.leave)),
]);

/**
 * Slide Down Animation
 * Top-aligned modals
 */
export const modalSlideDown: AnimationTriggerMetadata = trigger('slideDown', [
  state('void', style({
    opacity: 0,
    transform: 'translateY(-100%)',
  })),
  state('enter', style({
    opacity: 1,
    transform: 'translateY(0)',
  })),
  transition('void => enter', animate(ANIMATION_TIMINGS.enter)),
  transition('enter => void', animate(ANIMATION_TIMINGS.leave)),
]);

/**
 * Slide Left Animation
 * Right-aligned modals (sidebar style)
 */
export const modalSlideLeft: AnimationTriggerMetadata = trigger('slideLeft', [
  state('void', style({
    opacity: 0,
    transform: 'translateX(100%)',
  })),
  state('enter', style({
    opacity: 1,
    transform: 'translateX(0)',
  })),
  transition('void => enter', animate(ANIMATION_TIMINGS.enter)),
  transition('enter => void', animate(ANIMATION_TIMINGS.leave)),
]);

/**
 * Slide Right Animation
 * Left-aligned modals
 */
export const modalSlideRight: AnimationTriggerMetadata = trigger('slideRight', [
  state('void', style({
    opacity: 0,
    transform: 'translateX(-100%)',
  })),
  state('enter', style({
    opacity: 1,
    transform: 'translateX(0)',
  })),
  transition('void => enter', animate(ANIMATION_TIMINGS.enter)),
  transition('enter => void', animate(ANIMATION_TIMINGS.leave)),
]);

/**
 * Scale Animation (Center Modals)
 * Zoom in/out effect with fade
 */
export const modalScale: AnimationTriggerMetadata = trigger('scale', [
  state('void', style({
    opacity: 0,
    transform: 'translateY(24px) scale(0.95)',
  })),
  state('enter', style({
    opacity: 1,
    transform: 'translateY(0) scale(1)',
  })),
  transition('void => enter', animate(ANIMATION_TIMINGS.enter)),
  transition('enter => void', animate(ANIMATION_TIMINGS.leave)),
]);

/**
 * Fade Animation (Subtle, no movement)
 */
export const modalFade: AnimationTriggerMetadata = trigger('fade', [
  state('void', style({
    opacity: 0,
  })),
  state('enter', style({
    opacity: 1,
  })),
  transition('void => enter', animate(ANIMATION_TIMINGS.enter)),
  transition('enter => void', animate(ANIMATION_TIMINGS.leave)),
]);

/**
 * Backdrop Fade Animation
 * For overlay backdrops
 */
export const backdropFade: AnimationTriggerMetadata = trigger('backdropFade', [
  state('void', style({
    opacity: 0,
  })),
  state('enter', style({
    opacity: 1,
  })),
  transition('void => enter', animate('250ms cubic-bezier(0.16, 1, 0.3, 1)')),
  transition('enter => void', animate('200ms ease-out')),
]);
