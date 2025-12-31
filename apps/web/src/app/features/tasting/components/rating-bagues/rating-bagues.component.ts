import { Component, input, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Rating Bagues Component
 * Interactive cigar band rating system (Havanoscope style)
 *
 * Scale: 0.5 to 5, by 0.5 steps (10 possible values)
 * Visual: ◉ (full) ◐ (half) ○ (empty)
 *
 * Example for 3.5/5: ◉ ◉ ◉ ◐ ○
 */
@Component({
  selector: 'app-rating-bagues',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="rating-bagues">
      @if (label()) {
        <label class="rating-label">{{ label() }}</label>
      }

      <div class="bagues-container">
        @for (position of positions; track $index) {
          <div
            class="bague-wrapper"
            (click)="selectRating(position)"
            (mouseenter)="hoverRating(position)"
            (mouseleave)="hoverRating(null)"
          >
            <div class="bague" [class.bague-interactive]="!readonly()">
              @switch (getBagueState(position)) {
                @case ('full') {
                  <svg width="40" height="40" viewBox="0 0 40 40">
                    <circle
                      cx="20"
                      cy="20"
                      r="16"
                      fill="currentColor"
                      class="bague-full"
                    />
                  </svg>
                }
                @case ('half') {
                  <svg width="40" height="40" viewBox="0 0 40 40">
                    <circle
                      cx="20"
                      cy="20"
                      r="16"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      class="bague-stroke"
                    />
                    <path
                      d="M 20 4 A 16 16 0 0 1 20 36 Z"
                      fill="currentColor"
                      class="bague-half"
                    />
                  </svg>
                }
                @case ('empty') {
                  <svg width="40" height="40" viewBox="0 0 40 40">
                    <circle
                      cx="20"
                      cy="20"
                      r="16"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      class="bague-empty"
                    />
                  </svg>
                }
              }
            </div>
          </div>
        }
      </div>

      @if (showValue()) {
        <div class="rating-value">{{ displayValue() }}</div>
      }
    </div>
  `,
  styles: [
    `
      .rating-bagues {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      .rating-label {
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--color-text-primary);
      }

      .bagues-container {
        display: flex;
        gap: 0.5rem;
        align-items: center;
      }

      .bague-wrapper {
        position: relative;
      }

      .bague {
        width: 40px;
        height: 40px;
        color: var(--color-text-tertiary);
        transition: all 0.2s;
      }

      .bague-interactive {
        cursor: pointer;
      }

      .bague-interactive:hover {
        transform: scale(1.1);
      }

      .bague-full {
        color: var(--color-primary);
      }

      .bague-half {
        color: var(--color-primary);
      }

      .bague-stroke {
        color: var(--color-primary);
      }

      .bague-empty {
        color: var(--color-border);
      }

      .rating-value {
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--color-text-primary);
        text-align: center;
      }
    `,
  ],
})
export class RatingBaguesComponent {
  // Inputs
  value = input<number>(0);
  label = input<string>('');
  readonly = input<boolean>(false);
  showValue = input<boolean>(true);

  // Outputs
  valueChange = output<number>();

  // Internal state
  private hoverValue = signal<number | null>(null);

  // Positions for 5 bagues (each can be: empty, half, full)
  positions = [1, 2, 3, 4, 5];

  // Computed display value
  displayValue = computed(() => {
    const val = this.hoverValue() ?? this.value();
    return val > 0 ? `${val.toFixed(1)}/5` : 'Non noté';
  });

  /**
   * Get bague state for a position
   * @param position 1-5
   */
  getBagueState(position: number): 'full' | 'half' | 'empty' {
    const currentValue = this.hoverValue() ?? this.value();

    if (currentValue >= position) {
      return 'full';
    }

    if (currentValue >= position - 0.5) {
      return 'half';
    }

    return 'empty';
  }

  /**
   * Select rating when clicking a bague
   * Click on left half = X.5, click on right half = X.0 (next full)
   */
  selectRating(position: number): void {
    if (this.readonly()) return;

    const currentValue = this.value();

    // Toggle logic:
    // - If empty → set to half (position - 0.5)
    // - If half → set to full (position)
    // - If full → set to half (position - 0.5)

    let newValue: number;

    if (currentValue < position - 0.5) {
      // Empty → Half
      newValue = position - 0.5;
    } else if (currentValue === position - 0.5) {
      // Half → Full
      newValue = position;
    } else if (currentValue === position) {
      // Full → Half (or empty if position 1)
      newValue = position === 1 ? 0 : position - 0.5;
    } else {
      // Click on filled bague → reset to this position
      newValue = position;
    }

    // Ensure value is between 0 and 5
    newValue = Math.max(0, Math.min(5, newValue));

    this.valueChange.emit(newValue);
  }

  hoverRating(position: number | null): void {
    if (this.readonly()) return;
    this.hoverValue.set(position);
  }
}
