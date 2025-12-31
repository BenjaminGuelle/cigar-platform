import { Component, input, output, computed, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconDirective, type IconName } from '../../directives/icon';
import { LucideAngularModule, ShieldCheck, Sparkles } from 'lucide-angular';
import clsx from 'clsx';

/**
 * Search Result Item Component
 *
 * Compact, elegant representation of a search result
 * Used in Global Intelligent Search modal
 *
 * Design:
 * - Minimal, clean, high-end
 * - Icon badge for entity type/status
 * - Hover states with gold accent
 * - Keyboard navigation support (active state)
 * - Quick visual scan (name prominent, meta subtle)
 *
 * MVP: Clubs only
 * Future: Users, Events, Cigars
 *
 * @example
 * ```html
 * <ui-search-result-item
 *   [title]="'Cuban Cigars Club'"
 *   [subtitle]="'24 membres · Public'"
 *   [iconBadge]="'public'"
 *   [isActive]="false"
 *   (clicked)="handleClick()"
 * />
 * ```
 */

export type SearchResultIconBadge = 'public' | 'private' | 'user' | 'event' | 'cigar' | 'verified' | 'community';
export type SearchResultEntityType = 'brand' | 'cigar' | 'club' | 'user' | 'event';

const CLASSES = {
  container: {
    base: 'group relative flex items-center gap-3 px-4 py-2 border-b border-smoke-700/30 transition-all duration-150 cursor-pointer',
    hover: 'hover:bg-smoke-700/30',
    active: 'bg-smoke-700/50 border-gold-500/30',
    last: 'border-b-0',
  },
  avatar: {
    container: 'flex-shrink-0 w-8 h-8 rounded-full bg-smoke-700 flex items-center justify-center overflow-hidden',
    containerGold: 'flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-gold-500 to-gold-700 flex items-center justify-center overflow-hidden',
    image: 'w-full h-full object-cover',
    icon: 'w-4 h-4 text-smoke-400',
    iconGold: 'w-4 h-4 text-smoke-900',
  },
  content: {
    container: 'flex-1 min-w-0',
    title: 'text-sm font-semibold text-smoke-100 truncate transition-colors duration-150 group-hover:text-gold-500',
    subtitle: 'text-xs text-smoke-400 truncate mt-0.5',
  },
  badge: {
    container: 'flex-shrink-0 px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1.5',
    public: 'bg-green-400/10 text-green-400 border border-green-400/20',
    private: 'bg-orange-400/10 text-orange-400 border border-orange-400/20',
    verified: 'bg-gold-500/10 text-gold-500 border border-gold-500/20',
    community: 'bg-smoke-600/50 text-smoke-300 border border-smoke-600/50',
  },
} as const;

@Component({
  selector: 'ui-search-result-item',
  standalone: true,
  imports: [CommonModule, IconDirective, LucideAngularModule],
  template: `
    <div
      (click)="handleClick()"
      [class]="containerClasses()"
      role="option"
      [attr.aria-selected]="isActive()"
    >
      <!-- Avatar / Icon -->
      <div [class]="avatarContainerClasses()">
        @if (avatarUrl()) {
          <img
            [src]="avatarUrl()"
            [alt]="title()"
            [class]="CLASSES.avatar.image"
          />
        } @else {
          <i
            [name]="entityIcon()"
            [class]="avatarIconClasses()"
          ></i>
        }
      </div>

      <!-- Content (title + subtitle) -->
      <div [class]="CLASSES.content.container">
        <div [class]="CLASSES.content.title">
          {{ title() }}
        </div>
        @if (subtitle()) {
          <div [class]="CLASSES.content.subtitle">
            {{ subtitle() }}
          </div>
        }
      </div>

      <!-- Badges -->
      @if (iconBadge()) {
        <div [class]="badgeClasses()">
          @switch (iconBadge()) {
            @case ('public') {
              Public
            }
            @case ('private') {
              Privé
            }
            @case ('verified') {
              <lucide-icon [img]="ShieldCheck" [size]="14" />
              Certifié
            }
            @case ('community') {
              <lucide-icon [img]="Sparkles" [size]="14" />
              Proposé
            }
          }
        </div>
      }
    </div>
  `,
})
export class SearchResultItemComponent {
  // Inputs
  readonly title = input.required<string>();
  readonly subtitle = input<string>('');
  readonly iconBadge = input<SearchResultIconBadge | undefined>(undefined);
  readonly isActive = input<boolean>(false);
  readonly avatarUrl = input<string | null>(null);
  readonly entityType = input<SearchResultEntityType>('club');

  // Outputs
  readonly clicked = output<void>();

  // Class constants (expose for template)
  readonly CLASSES = CLASSES;

  // Icons (expose for template)
  readonly ShieldCheck = ShieldCheck;
  readonly Sparkles = Sparkles;

  // Computed
  readonly entityIcon: Signal<IconName> = computed<IconName>(() => {
    const type = this.entityType();
    const iconMap: Record<SearchResultEntityType, IconName> = {
      brand: 'star',
      cigar: 'flame',
      club: 'users',
      user: 'user',
      event: 'calendar',
    };
    return iconMap[type];
  });

  readonly containerClasses: Signal<string> = computed<string>(() => {
    return clsx(
      CLASSES.container.base,
      CLASSES.container.hover,
      this.isActive() && CLASSES.container.active
    );
  });

  readonly badgeClasses: Signal<string> = computed<string>(() => {
    const badge = this.iconBadge();
    if (!badge) return '';

    const badgeStyleMap: Record<SearchResultIconBadge, string> = {
      public: CLASSES.badge.public,
      private: CLASSES.badge.private,
      verified: CLASSES.badge.verified,
      community: CLASSES.badge.community,
      user: '',
      event: '',
      cigar: '',
    };

    return clsx(
      CLASSES.badge.container,
      badgeStyleMap[badge]
    );
  });

  readonly avatarContainerClasses: Signal<string> = computed<string>(() => {
    const type = this.entityType();
    const isPremium = type === 'brand' || type === 'cigar';
    return isPremium ? CLASSES.avatar.containerGold : CLASSES.avatar.container;
  });

  readonly avatarIconClasses: Signal<string> = computed<string>(() => {
    const type = this.entityType();
    const isPremium = type === 'brand' || type === 'cigar';
    return isPremium ? CLASSES.avatar.iconGold : CLASSES.avatar.icon;
  });

  // Event handler
  handleClick(): void {
    this.clicked.emit();
  }
}
