import {
  Component,
  input,
  output,
  signal,
  computed,
  effect,
  HostListener,
  ChangeDetectionStrategy,
  ElementRef,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import type { ClubMemberResponseDto } from '@cigar-platform/types';
import { IconDirective } from '@cigar-platform/shared/ui';

/**
 * Manage Member Menu Component
 *
 * Dropdown menu for member management actions
 * - Desktop: Positioned dropdown next to trigger button
 * - Mobile: Same dropdown (could be bottom sheet in future)
 *
 * Actions:
 * - Promote to admin (if member)
 * - Demote to member (if admin)
 * - Remove from club
 * - Ban from club
 *
 * @example
 * ```html
 * <app-manage-member-menu
 *   [member]="member()"
 *   [isOpen]="menuOpen()"
 *   (close)="menuOpen.set(false)"
 *   (promote)="handlePromote($event)"
 *   (demote)="handleDemote($event)"
 *   (remove)="handleRemove($event)"
 *   (ban)="handleBan($event)"
 * />
 * ```
 */
@Component({
  selector: 'app-manage-member-menu',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, IconDirective],
  template: `
    @if (isOpen()) {
      <!-- Backdrop (mobile only) -->
      <div
        class="md:hidden fixed inset-0 bg-black/50 z-40"
        (click)="handleClose()">
      </div>

      <!-- Menu Dropdown -->
      <div
        class="absolute right-0 top-8 z-50 w-56 bg-smoke-800 border border-smoke-700 rounded-lg shadow-xl overflow-hidden"
        (click)="$event.stopPropagation()">

        <!-- Member Info Header -->
        <div class="px-4 py-3 border-b border-smoke-700">
          <div class="text-xs font-medium text-smoke-400 uppercase tracking-wider mb-1">
            Gérer le membre
          </div>
          <div class="text-sm font-medium text-white truncate">
            {{ member().user.displayName }}
          </div>
        </div>

        <!-- Actions -->
        <div class="py-1">
          <!-- Promote to Admin (only for members) -->
          @if (canPromote()) {
            <button
              (click)="handlePromote()"
              type="button"
              class="w-full px-4 py-2.5 text-left text-sm text-smoke-200 hover:bg-smoke-700 transition-colors flex items-center gap-3">
              <i name="chevron-up" class="w-4 h-4 text-blue-400"></i>
              <span>Promouvoir admin</span>
            </button>
          }

          <!-- Demote to Member (only for admins) -->
          @if (canDemote()) {
            <button
              (click)="handleDemote()"
              type="button"
              class="w-full px-4 py-2.5 text-left text-sm text-smoke-200 hover:bg-smoke-700 transition-colors flex items-center gap-3">
              <i name="chevron-down" class="w-4 h-4 text-smoke-400"></i>
              <span>Rétrograder membre</span>
            </button>
          }

          <!-- Divider -->
          <div class="my-1 border-t border-smoke-700"></div>

          <!-- Remove from Club -->
          <button
            (click)="handleRemove()"
            type="button"
            class="w-full px-4 py-2.5 text-left text-sm text-smoke-200 hover:bg-smoke-700 transition-colors flex items-center gap-3">
            <i name="minus" class="w-4 h-4 text-orange-400"></i>
            <span>Retirer du club</span>
          </button>

          <!-- Ban from Club -->
          <button
            (click)="handleBan()"
            type="button"
            class="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-smoke-700 transition-colors flex items-center gap-3">
            <i name="x" class="w-4 h-4 text-red-400"></i>
            <span>Bannir du club</span>
          </button>
        </div>
      </div>
    }
  `,
  host: {
    '[class]': '"relative"',
  },
})
export class ManageMemberMenuComponent {
  // ElementRef injection for proper click outside detection
  private readonly elementRef = inject(ElementRef);

  // Inputs
  readonly member = input.required<ClubMemberResponseDto>();
  readonly isOpen = input<boolean>(false);

  // Outputs
  readonly close = output<void>();
  readonly promote = output<ClubMemberResponseDto>();
  readonly demote = output<ClubMemberResponseDto>();
  readonly remove = output<ClubMemberResponseDto>();
  readonly ban = output<ClubMemberResponseDto>();

  // Computed: Can promote (member → admin)
  readonly canPromote = computed(() => {
    return this.member().role === 'member';
  });

  // Computed: Can demote (admin → member)
  readonly canDemote = computed(() => {
    return this.member().role === 'admin';
  });

  /**
   * Handle promote action
   */
  handlePromote(): void {
    this.promote.emit(this.member());
    this.handleClose();
  }

  /**
   * Handle demote action
   */
  handleDemote(): void {
    this.demote.emit(this.member());
    this.handleClose();
  }

  /**
   * Handle remove action
   */
  handleRemove(): void {
    this.remove.emit(this.member());
    this.handleClose();
  }

  /**
   * Handle ban action
   */
  handleBan(): void {
    this.ban.emit(this.member());
    this.handleClose();
  }

  /**
   * Handle close
   */
  handleClose(): void {
    this.close.emit();
  }

  /**
   * Close menu on Escape key
   */
  @HostListener('window:keydown.escape')
  onEscapeKey(): void {
    if (this.isOpen()) {
      this.handleClose();
    }
  }

  /**
   * Close menu on click outside
   * Uses ElementRef to avoid conflicts with multiple menus on the page
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.isOpen()) return;

    // Close if clicked outside this specific component instance
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.handleClose();
    }
  }
}
