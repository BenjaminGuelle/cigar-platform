import {
  Component,
  input,
  output,
  signal,
  computed,
  effect,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import type { UserDto } from '@cigar-platform/types';

export type AvatarUploadType = 'user' | 'club';
export type AvatarUploadSize = 'sm' | 'md' | 'lg';

const SIZE_CLASSES = {
  sm: 'h-12 w-12 md:h-14 md:w-14',
  md: 'h-16 w-16 md:h-20 md:w-20',
  lg: 'h-20 w-20 md:h-24 md:w-24',
};

/**
 * Avatar Upload Component
 *
 * Generic component for uploading user or club avatars
 *
 * Features:
 * - File selection with validation
 * - Preview display
 * - Upload with loading state
 * - Consistent sizing
 * - No flickering between preview/actual
 *
 * @example
 * ```html
 * <ui-avatar-upload
 *   type="user"
 *   [user]="currentUser()"
 *   [loading]="uploadLoading()"
 *   [size]="md"
 *   (fileSelected)="onFileSelected($event)"
 * />
 * ```
 */
@Component({
  selector: 'ui-avatar-upload',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-center gap-6">
      <!-- Avatar Preview -->
      @if (previewUrl()) {
        <!-- Show preview while uploading or after selection -->
        <img
          [src]="previewUrl()!"
          alt="Preview"
          [class]="avatarClasses()"
        />
      } @else if (hasValidImage()) {
        <!-- User or Club avatar with image (cache-busted) -->
        <img
          [src]="avatarUrlWithCache()"
          [alt]="type() === 'user' ? user()!.displayName : name()"
          [class]="avatarClasses()"
          (error)="onImageError()"
          decoding="async"
        />
      } @else {
        <!-- Fallback: initials for club or user without avatar -->
        <div [class]="fallbackClasses()">
          <span class="text-xl md:text-2xl font-bold text-gold-500">
            {{ initials() }}
          </span>
        </div>
      }

      <!-- Upload controls -->
      <div class="flex-1">
        <input
          type="file"
          [id]="inputId()"
          accept="image/jpeg,image/png,image/webp"
          (change)="onFileChange($event)"
          class="hidden"
        />
        <label
          [for]="inputId()"
          class="inline-block body-sm cursor-pointer text-gold-500 transition-colors hover:text-gold-400 font-medium"
          [class.opacity-50]="loading()"
          [class.pointer-events-none]="loading()"
        >
          @if (loading()) {
            Chargement...
          } @else {
            {{ uploadLabel() }}
          }
        </label>
        <p class="caption mt-1">JPG, PNG, WebP (max 5MB)</p>
      </div>
    </div>
  `,
})
export class AvatarUploadComponent {
  // Inputs
  readonly type = input.required<AvatarUploadType>();
  readonly size = input<AvatarUploadSize>('md');
  readonly user = input<UserDto | null>(null);
  readonly imageUrl = input<string | null>(null);
  readonly name = input<string>('');
  readonly loading = input<boolean>(false);
  readonly inputId = input<string>(`avatar-upload-${Math.random()}`);

  // Outputs
  readonly fileSelected = output<File>();

  // State
  readonly #previewUrl = signal<string | null>(null);
  readonly #imageError = signal<boolean>(false);
  readonly #urlVersion = signal<number>(Date.now());

  // Computed
  readonly SIZE_CLASSES = SIZE_CLASSES;

  readonly previewUrl = computed(() => this.#previewUrl());

  readonly hasValidImage = computed(() => {
    if (this.type() === 'user') {
      return !this.#imageError() && !!this.user()?.avatarUrl;
    }
    return !this.#imageError() && !!this.imageUrl();
  });

  readonly avatarUrlWithCache = computed(() => {
    const baseUrl = this.type() === 'user' ? this.user()?.avatarUrl : this.imageUrl();
    if (!baseUrl) return '';

    // Add cache-busting parameter to force browser to reload image
    const separator = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${separator}v=${this.#urlVersion()}`;
  });

  readonly uploadLabel = computed(() => {
    return this.type() === 'user' ? 'Changer la photo' : "Changer l'avatar";
  });

  readonly initials = computed(() => {
    if (this.type() === 'user' && this.user()) {
      return this.user()!.displayName.charAt(0).toUpperCase();
    }
    return this.name().charAt(0).toUpperCase() || 'C';
  });

  readonly avatarClasses = computed(() => {
    return `${SIZE_CLASSES[this.size()]} rounded-full object-cover shadow-md ring-2 ring-gold-500/30`;
  });

  readonly fallbackClasses = computed(() => {
    return `${SIZE_CLASSES[this.size()]} rounded-full bg-smoke-800 flex items-center justify-center shadow-md ring-2 ring-gold-500/30`;
  });

  constructor() {
    // Update version timestamp when user/club data changes to bust cache
    // This ensures cache is busted even if URL string is the same
    effect(() => {
      // Track the entire object/URL, not just the URL value
      if (this.type() === 'user') {
        const userEntity = this.user();
        if (userEntity) {
          this.#urlVersion.set(Date.now());
        }
      } else {
        const clubImageUrl = this.imageUrl();
        if (clubImageUrl) {
          this.#urlVersion.set(Date.now());
        }
      }
    });

    // Auto-clear preview when avatar URL changes (upload completed)
    // This prevents flickering by keeping preview until new image loads
    effect(() => {
      if (this.type() === 'user') {
        // Watch user avatarUrl
        const userAvatarUrl = this.user()?.avatarUrl;
        if (userAvatarUrl && this.#previewUrl()) {
          // Upload completed and new avatar loaded, clear preview
          this.#previewUrl.set(null);
        }
      } else {
        // Watch club imageUrl
        const clubImageUrl = this.imageUrl();
        if (clubImageUrl && this.#previewUrl()) {
          // Upload completed and new avatar loaded, clear preview
          this.#previewUrl.set(null);
        }
      }
    });

    // Reset image error when URL changes
    effect(() => {
      if (this.type() === 'user') {
        this.user()?.avatarUrl; // Track changes
      } else {
        this.imageUrl(); // Track changes
      }
      this.#imageError.set(false);
    });
  }

  onImageError(): void {
    this.#imageError.set(true);
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];

    // Validation
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      // TODO: Use toast service when injected
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      // TODO: Use toast service when injected
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      this.#previewUrl.set(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Emit file for parent to handle upload
    this.fileSelected.emit(file);
  }
}