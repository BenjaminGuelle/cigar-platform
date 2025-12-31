import { Component, input, output, signal, computed, effect, ChangeDetectionStrategy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

/**
 * Slider Component
 *
 * Elegant, tactile slider for numeric values (1-5)
 * Optimized for mobile (thumb-friendly) and desktop
 *
 * ALL STARS Architecture ⭐
 * - Reactive with FormControl
 * - Accessible (ARIA labels, keyboard support)
 * - Responsive design
 * - Theme-aware (gold/smoke)
 *
 * Features:
 * - Large touch targets (48px minimum)
 * - Visual feedback on interaction
 * - Optional labels for each step
 * - Smooth transitions
 *
 * @example
 * ```html
 * <ui-slider
 *   label="Puissance"
 *   [control]="strengthControl"
 *   [min]="1"
 *   [max]="5"
 *   [labels]="strengthLabels"
 * />
 * ```
 */

const CLASSES = {
  container: 'space-y-3',
  label: {
    container: 'flex items-center justify-between mb-2',
    text: 'text-sm font-medium text-smoke-200',
    value: 'text-sm font-semibold text-gold-500',
  },
  track: {
    wrapper: 'relative h-12 flex items-center bg-transparent cursor-pointer select-none',
    background: 'absolute inset-y-0 left-0 right-0 h-2 my-auto bg-smoke-700 rounded-full',
    fill: 'absolute inset-y-0 left-0 h-2 my-auto bg-gradient-to-r from-gold-600 to-gold-400 rounded-full transition-all duration-150',
  },
  thumb: {
    base: 'absolute w-5 h-5 bg-gradient-to-br from-gold-500 to-gold-600 rounded-full border-2 border-smoke-900 shadow-lg cursor-grab active:cursor-grabbing transition-transform hover:scale-110 active:scale-105 z-20',
  },
  steps: {
    container: 'flex justify-between items-center mt-0 px-1',
    dot: 'w-1.5 h-1.5 rounded-full transition-colors duration-200',
    dotActive: 'bg-gold-500',
    dotInactive: 'bg-smoke-600',
  },
  currentLabel: 'text-xs text-center text-smoke-300 mt-2',
} as const;

@Component({
  selector: 'ui-slider',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './slider.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SliderComponent {
  @ViewChild('trackRef') trackRef?: ElementRef<HTMLDivElement>;

  // Inputs
  readonly label = input<string>('');
  readonly control = input.required<FormControl<number | null>>();
  readonly min = input<number>(1);
  readonly max = input<number>(5);
  readonly step = input<number>(1);
  readonly labels = input<Record<number, string>>({});
  readonly required = input<boolean>(false);

  // Internal state
  readonly isFocused = signal<boolean>(false);
  readonly isDragging = signal<boolean>(false);

  // Internal signal to hold the control value (synced with FormControl)
  private readonly controlValueSignal = signal<number | null>(null);

  // Visual drag position (0-100%) for smooth dragging experience
  private readonly dragPercentage = signal<number | null>(null);

  // Computed - Now reactive to FormControl changes!
  readonly value = computed(() => this.controlValueSignal() ?? this.min());

  // Visual percentage - uses drag position during drag, otherwise uses actual value
  readonly percentage = computed(() => {
    const dragPos = this.dragPercentage();
    if (dragPos !== null && this.isDragging()) {
      return dragPos;
    }
    const val = this.value();
    const minVal = this.min();
    const maxVal = this.max();
    return ((val - minVal) / (maxVal - minVal)) * 100;
  });

  readonly currentLabel = computed(() => {
    const val = this.value();
    const labelsMap = this.labels();
    return labelsMap[val] || '';
  });

  readonly steps = computed(() => {
    const minVal = this.min();
    const maxVal = this.max();
    const stepVal = this.step();
    const stepsArray: number[] = [];

    for (let i = minVal; i <= maxVal; i += stepVal) {
      stepsArray.push(i);
    }

    return stepsArray;
  });

  // Class constants (expose for template)
  readonly CLASSES = CLASSES;

  constructor() {
    // Sync FormControl changes to Signal (bridge Reactive Forms → Signals)
    effect((onCleanup) => {
      const ctrl = this.control();

      // Set initial value
      this.controlValueSignal.set(ctrl.value);

      // Subscribe to value changes
      const subscription = ctrl.valueChanges.subscribe(value => {
        this.controlValueSignal.set(value);
      });

      // Cleanup subscription when effect re-runs or component destroys
      onCleanup(() => subscription.unsubscribe());
    });

    // Initialize with min value if no value set
    effect(() => {
      const ctrl = this.control();
      if (ctrl.value === null || ctrl.value === undefined) {
        ctrl.setValue(this.min(), { emitEvent: false });
      }
    });
  }

  handleFocus(): void {
    this.isFocused.set(true);
  }

  handleBlur(): void {
    this.isFocused.set(false);
  }

  isStepActive(stepValue: number): boolean {
    return stepValue <= this.value();
  }

  /**
   * Handle click on track (jump to position)
   */
  handleTrackClick(event: MouseEvent | TouchEvent): void {
    // Don't process if clicking on thumb
    const target = event.target as HTMLElement;
    if (target.classList.contains('slider-thumb')) {
      return;
    }

    if (this.isDragging()) return;

    const trackEl = this.trackRef?.nativeElement;
    if (!trackEl) return;

    const rect = trackEl.getBoundingClientRect();
    const clientX = event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
    const percentage = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));

    const range = this.max() - this.min();
    const rawValue = this.min() + percentage * range;
    const steppedValue = Math.round(rawValue / this.step()) * this.step();
    const clampedValue = Math.max(this.min(), Math.min(this.max(), steppedValue));

    this.control().setValue(clampedValue);
  }

  /**
   * Handle mouse down on thumb (start drag)
   */
  handleThumbMouseDown(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);

    const handleMouseMove = (e: MouseEvent) => {
      this.updateValueFromPosition(e.clientX);
    };

    const handleMouseUp = () => {
      this.isDragging.set(false);
      this.dragPercentage.set(null); // Reset visual drag position
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }

  /**
   * Handle touch start on thumb (start drag)
   */
  handleThumbTouchStart(event: TouchEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);

    const handleTouchMove = (e: TouchEvent) => {
      this.updateValueFromPosition(e.touches[0].clientX);
    };

    const handleTouchEnd = () => {
      this.isDragging.set(false);
      this.dragPercentage.set(null); // Reset visual drag position
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };

    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);
  }

  /**
   * Update value based on X position
   */
  private updateValueFromPosition(clientX: number): void {
    const trackEl = this.trackRef?.nativeElement;
    if (!trackEl) return;

    const rect = trackEl.getBoundingClientRect();
    const percentage = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));

    // Update visual position immediately for smooth dragging
    this.dragPercentage.set(percentage * 100);

    // Calculate and update the actual stepped value
    const range = this.max() - this.min();
    const rawValue = this.min() + percentage * range;
    const steppedValue = Math.round(rawValue / this.step()) * this.step();
    const clampedValue = Math.max(this.min(), Math.min(this.max(), steppedValue));

    this.control().setValue(clampedValue);
  }
}
