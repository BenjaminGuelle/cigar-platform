import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { ClubResponseDto } from '@cigar-platform/types';
import { ButtonComponent } from '../button';
import { IconDirective } from '../../directives/icon';

/**
 * Club Card Component
 *
 * Themed card for displaying club information in discovery/explore views
 *
 * Design System:
 * - Smoke-850/900 backgrounds (consistent with app theme)
 * - Gold-500 accents for focus and hover states
 * - Smooth transitions and hover effects
 * - Visibility badges (green for public, orange for private)
 *
 * @example
 * ```html
 * <ui-club-card
 *   [club]="club"
 *   (cardClick)="navigateToClub($event)"
 *   (joinClick)="handleJoinClub($event)"
 * />
 * ```
 */

const CLASSES = {
  card: {
    base: 'group relative overflow-hidden rounded-xl border-2 transition-all duration-300 cursor-pointer',
    background: 'bg-smoke-850',
    border: 'border-smoke-700 hover:border-gold-500/50',
    shadow: 'shadow-md hover:shadow-2xl hover:shadow-gold-500/10',
    transform: 'hover:-translate-y-1',
  },
  header: {
    container: 'flex items-start justify-between gap-4 mb-4',
    content: 'flex-1 min-w-0',
    title: 'text-xl font-bold text-smoke-100 mb-2 group-hover:text-gold-500 transition-colors duration-200',
    description: 'text-sm text-smoke-400 line-clamp-2',
  },
  badge: {
    base: 'px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide whitespace-nowrap shrink-0',
    public: 'bg-green-500/10 text-green-400 border border-green-500/20',
    private: 'bg-orange-500/10 text-orange-400 border border-orange-500/20',
  },
  stats: {
    container: 'flex items-center gap-4 mb-6 text-sm text-smoke-400',
    item: 'flex items-center gap-2',
    icon: 'w-4 h-4',
  },
  glowEffect: 'absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none bg-gradient-to-br from-gold-500/5 to-transparent',
} as const;

@Component({
  selector: 'ui-club-card',
  standalone: true,
  imports: [CommonModule, ButtonComponent, IconDirective],
  template: `
    <div
      (click)="onCardClick()"
      [class]="cardClasses"
    >
      <!-- Hover glow effect -->
      <div [class]="CLASSES.glowEffect"></div>

      <div class="relative p-6">
        <!-- Header: Name + Description + Visibility Badge -->
        <div [class]="CLASSES.header.container">
          <div [class]="CLASSES.header.content">
            <h3 [class]="CLASSES.header.title">
              {{ club().name }}
            </h3>
            @if (club().description) {
              <p [class]="CLASSES.header.description">
                {{ club().description }}
              </p>
            }
          </div>

          <!-- Visibility Badge -->
          <span [class]="visibilityBadgeClasses">
            {{ club().visibility === 'PUBLIC' ? 'Public' : 'Privé' }}
          </span>
        </div>

        <!-- Stats: Member count, etc. -->
        <div [class]="CLASSES.stats.container">
          <div [class]="CLASSES.stats.item">
            <i name="users" [class]="CLASSES.stats.icon"></i>
            <span>{{ memberCount() }} {{ memberCount() === 1 ? 'membre' : 'membres' }}</span>
          </div>
        </div>

        <!-- Join Button -->
        <ui-button
          (click)="onJoinClick($event)"
          variant="primary"
          class="w-full"
        >
          {{ club().visibility === 'PUBLIC' ? 'Rejoindre' : "Demander l'accès" }}
        </ui-button>
      </div>
    </div>
  `,
})
export class ClubCardComponent {
  // Inputs
  readonly club = input.required<ClubResponseDto>();
  readonly memberCount = input<number>(0);

  // Outputs
  readonly cardClick = output<string>();
  readonly joinClick = output<string>();

  // Class constants (expose for template)
  readonly CLASSES = CLASSES;

  // Computed classes
  get cardClasses(): string {
    return [
      CLASSES.card.base,
      CLASSES.card.background,
      CLASSES.card.border,
      CLASSES.card.shadow,
      CLASSES.card.transform,
    ].join(' ');
  }

  get visibilityBadgeClasses(): string {
    const isPublic = this.club().visibility === 'PUBLIC';
    return [
      CLASSES.badge.base,
      isPublic ? CLASSES.badge.public : CLASSES.badge.private,
    ].join(' ');
  }

  // Event handlers
  onCardClick(): void {
    this.cardClick.emit(this.club().id);
  }

  onJoinClick(event: Event): void {
    event.stopPropagation(); // Prevent card click navigation
    this.joinClick.emit(this.club().id);
  }
}
