import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { TastingResponseDto } from '@cigar-platform/types';

/**
 * Tasting Card Component
 *
 * Instagram-style card for displaying tastings in a grid.
 * Used on user profiles, club profiles, and explore views.
 *
 * Design:
 * - 4:5 aspect ratio (compact, good for info display)
 * - Cover image with gradient overlay for text readability
 * - Default fallback image when no photo
 * - Hover scale effect
 *
 * @example
 * ```html
 * <!-- Simple usage with data -->
 * <ui-tasting-card
 *   [tasting]="tasting"
 *   [showUsername]="true"
 *   (cardClick)="onTastingClick($event)"
 * />
 *
 * <!-- Placeholder mode (no data) -->
 * <ui-tasting-card [showUsername]="false" />
 * ```
 */
@Component({
  selector: 'ui-tasting-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="relative aspect-4/5 rounded-sm overflow-hidden border border-smoke-600 bg-smoke-800 group cursor-pointer hover:scale-105 transition-transform"
      (click)="onCardClick()"
    >
      <!-- Photo (with fallback) -->
      <img
        [src]="imageUrl()"
        [alt]="altText()"
        class="absolute inset-0 w-full h-full object-cover object-center"
        [class.opacity-30]="!hasImage()"
      />

      <!-- Gradient overlay -->
      <div class="absolute inset-0 bg-linear-to-t from-smoke-700 via-smoke-900/20 to-transparent"></div>

      <!-- Top overlay (username) -->
      @if (showUsername() && displayUsername()) {
        <div class="absolute top-0 left-0 right-0 p-2">
          <span class="text-gold-600 text-[10px]">{{'@'}}{{ displayUsername() }}</span>
        </div>
      }

      <!-- Bottom info overlay -->
      <div class="absolute bottom-0 left-0 right-0 p-2">
        <p class="text-white text-m font-medium font-display truncate">{{ displayCigarName() }}</p>
        <div class="flex items-center justify-between mt-1">
          <span class="text-gold-400 text-xs font-bold">★ {{ displayRating() }}</span>
          <span class="text-smoke-300 text-[10px]">{{ displayDate() }}</span>
        </div>
      </div>
    </div>
  `,
})
export class TastingCardComponent {
  // Inputs
  readonly tasting = input<TastingResponseDto | null>(null);
  readonly showUsername = input<boolean>(false);

  // Outputs
  readonly cardClick = output<string>();

  // Default image path
  private readonly defaultImageUrl = '/images/tasting-default.png';

  // Computed values
  hasImage(): boolean {
    return !!this.tasting()?.photoUrl;
  }

  imageUrl(): string {
    return this.tasting()?.photoUrl ?? this.defaultImageUrl;
  }

  altText(): string {
    return this.tasting()?.cigar?.name ?? 'Dégustation';
  }

  displayCigarName(): string {
    return this.tasting()?.cigar?.name ?? 'Nom du cigare';
  }

  displayRating(): string {
    const rating = this.tasting()?.rating ?? 4.5;
    return rating.toFixed(1);
  }

  displayUsername(): string | null {
    return this.tasting()?.user?.username ?? null;
  }

  displayDate(): string {
    const tasting = this.tasting();
    if (!tasting?.createdAt) {
      return 'Il y a 2j';
    }

    const date = new Date(tasting.createdAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return "Aujourd'hui";
    } else if (diffDays === 1) {
      return 'Hier';
    } else if (diffDays < 7) {
      return `Il y a ${diffDays}j`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `Il y a ${weeks}sem`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `Il y a ${months}m`;
    } else {
      const years = Math.floor(diffDays / 365);
      return `Il y a ${years}an${years > 1 ? 's' : ''}`;
    }
  }

  // Event handlers
  onCardClick(): void {
    const tasting = this.tasting();
    if (tasting?.id) {
      this.cardClick.emit(tasting.id);
    }
  }
}