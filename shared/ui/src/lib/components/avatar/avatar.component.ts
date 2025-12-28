import { Component, input, computed, signal, effect, Signal, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User } from '@cigar-platform/types';
import clsx from 'clsx';

export type AvatarSize = 'sm' | 'md' | 'lg';

/**
 * Minimal User type for Avatar display
 * Avatar only needs these fields, not the full UserDto
 */
export type AvatarUser = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  email?: string; // Optional for fallback initials
};

/**
 * Minimal Club type for Avatar display
 * Avatar only needs these fields, not the full ClubDto
 */
export type AvatarClub = {
  id: string;
  name: string;
  imageUrl: string | null;
};

/**
 * Avatar Component
 * Displays user or club avatar with intelligent fallback hierarchy:
 *
 * For User:
 * 1. avatarUrl (image) if available
 * 2. Initials (2 letters max) from displayName
 * 3. First letter of displayName
 * 4. First letter of email
 * 5. Fallback 'U'
 *
 * For Club:
 * 1. imageUrl if available
 * 2. Initials (2 letters max) from name
 * 3. First letter of name
 * 4. Fallback 'C'
 */
@Component({
  selector: 'ui-avatar',
  standalone: true,
  imports: [CommonModule],
  template: `
      @if (hasAvatar()) {
          <img
                  [src]="avatarUrl()"
                  [alt]="altText()"
                  [class]="avatarClasses()"
                  decoding="async"
                  (error)="onImageError()"
          />
      } @else {
          <div [class]="avatarClasses()">
              {{ initials() }}
          </div>
      }
  `,
})
export class AvatarComponent {
  readonly user = input<User | AvatarUser | null>(null);
  readonly club = input<AvatarClub | null>(null);
  readonly size = input<AvatarSize>('md');

  #imageError: WritableSignal<boolean> = signal<boolean>(false);

  /**
   * Check if user or club has a valid avatar/imageUrl and image hasn't errored
   */
  readonly hasAvatar: Signal<boolean> = computed<boolean>(() => {
    const url = this.club()?.imageUrl ?? this.user()?.avatarUrl;
    return !!url && !this.#imageError();
  });

  /**
   * Get avatarUrl from user or imageUrl from club
   */
  readonly avatarUrl: Signal<string | null> = computed<string | null>(() => {
    return (this.club()?.imageUrl ?? this.user()?.avatarUrl) ?? null;
  });

  /**
   * Get alt text for avatar
   */
  readonly altText: Signal<string> = computed<string>(() => {
    if (this.club()) {
      return this.club()?.name ?? 'Club';
    }
    return this.user()?.displayName ?? 'User';
  });

  /**
   * Calculate user or club initials with intelligent logic:
   *
   * For Club:
   * - "Havana Club" → "HC" (2 letters)
   * - "Aficionados" → "A" (1 letter)
   * - Fallback → "C"
   *
   * For User:
   * - "John Doe" → "JD" (2 letters)
   * - "John" → "J" (1 letter)
   * - Email "john@example.com" → "J"
   * - Fallback → "U"
   */
  readonly initials: Signal<string> = computed<string>(() => {
    const club = this.club();
    if (club) {
      if (club.name) {
        const words = club.name.trim().split(/\s+/);
        if (words.length >= 2) {
          return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
        }
        return words[0].charAt(0).toUpperCase();
      }
      return 'C';
    }

    const user = this.user();
    if (!user) return 'U';

    if (user.displayName) {
      const words = user.displayName.trim().split(/\s+/);
      if (words.length >= 2) {
        return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
      }
      return words[0].charAt(0).toUpperCase();
    }

    if (user.email) {
      return user.email.charAt(0).toUpperCase();
    }

    return 'U';
  });

  /**
   * Dynamic avatar classes based on size and type (image vs initials)
   */
  readonly avatarClasses: Signal<string> = computed<string>(() => {
    const baseClasses = 'rounded-full object-cover shadow-lg';
    const isImage = this.hasAvatar();

    const sizeClasses = {
      sm: 'h-8 w-8 text-xs',
      md: 'h-9 w-9 text-sm',
      lg: 'h-12 w-12 text-base',
    };

    const initialsClasses = isImage
      ? ''
      : 'flex items-center justify-center bg-gradient-to-br from-gold-500 to-gold-600 font-bold text-smoke-950 shadow-gold-500/20';

    return clsx(baseClasses, sizeClasses[this.size()], initialsClasses);
  });

  /**
   * Handle image load error - fallback to initials
   */
  onImageError(): void {
    this.#imageError.set(true);
  }
}