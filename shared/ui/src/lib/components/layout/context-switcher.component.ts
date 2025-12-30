import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AvatarComponent } from '../avatar';
import { IconDirective } from '../../directives/icon';
import { ModalComponent } from '../modal';
import clsx from 'clsx';

/**
 * Context Switcher Component (Mobile Bottom Sheet)
 * Modal that slides up from bottom to allow context switching
 *
 * Shows:
 * - Solo context (user profile)
 * - All user's clubs
 * - Create/Join club action
 *
 * Usage:
 * <ui-context-switcher
 *   [isOpen]="isOpen()"
 *   [user]="currentUser()"
 *   [clubs]="userClubs()"
 *   [activeContext]="context()"
 *   (close)="onClose()"
 *   (contextSelected)="onContextSelected($event)"
 *   (createJoinClub)="onCreateJoinClub()"
 * />
 */
@Component({
  selector: 'ui-context-switcher',
  standalone: true,
  imports: [CommonModule, AvatarComponent, IconDirective, ModalComponent],
  template: `
    <ui-modal
      [isOpen]="isOpen()"
      variant="bottomSheet"
      size="md"
      [showCloseButton]="false"
      (close)="close.emit()"
    >
      <div class="pb-6 md:pb-0 md:hidden">
      <!-- Header -->
      <div class="mb-6">
        <h2 class="text-xl font-semibold text-smoke-50">Changer de contexte</h2>
        <p class="text-sm text-smoke-400">Basculer entre votre profil et vos clubs</p>
      </div>

      <!-- Solo Context -->
      <div class="mb-4">
        <h3 class="mb-2 text-xs font-medium uppercase tracking-wide text-smoke-500">Personnel</h3>
        <button
          type="button"
          (click)="selectSolo()"
          [class]="getContextItemClasses('solo')"
        >
          <ui-avatar [user]="user()" size="md" />
          <div class="flex-1 text-left">
            <div class="font-medium text-smoke-50">{{ user()?.displayName || 'Mon profil' }}</div>
            <div class="text-xs text-smoke-400">{{ user()?.email }}</div>
          </div>
          @if (activeContext().type === 'solo') {
            <div class="h-2 w-2 rounded-full bg-gold-500"></div>
          }
        </button>
      </div>

      <!-- Clubs -->
      <div class="mb-4">
        <h3 class="mb-2 text-xs font-medium uppercase tracking-wide text-smoke-500">Clubs</h3>

        @if (clubs().length === 0) {
          <div class="rounded-lg border border-dashed border-smoke-700 p-4 text-center">
            <p class="text-sm text-smoke-400">Vous n'avez rejoint aucun club</p>
          </div>
        } @else {
          <div class="space-y-2">
            @for (club of clubs(); track club.id) {
              <button
                type="button"
                (click)="selectClub(club)"
                [class]="getContextItemClasses('club', club.id)"
              >
                <ui-avatar [club]="club" size="md" />
                <div class="flex-1 text-left">
                  <div class="font-medium text-smoke-50">{{ club.name }}</div>
                  <div class="text-xs text-smoke-400">{{ club.memberCount || 0 }} membres</div>
                </div>
                @if (activeContext().type === 'club' && activeContext().clubId === club.id) {
                  <div class="h-2 w-2 rounded-full bg-gold-500"></div>
                }
              </button>
            }
          </div>
        }
      </div>

      <!-- Create/Join Club -->
      <button
        type="button"
        (click)="createJoinClub.emit(); close.emit()"
        class="w-full rounded-lg border-2 border-dashed border-smoke-600 p-4 text-center transition-colors hover:border-gold-500 hover:bg-smoke-800 active:scale-95"
      >
        <div class="flex items-center justify-center gap-2">
          <i name="plus" class="w-5 h-5 text-gold-500"></i>
          <span class="font-medium text-smoke-200">Créer ou rejoindre un club</span>
        </div>
      </button>
      </div>
    </ui-modal>
  `,
})
export class ContextSwitcherComponent {
  // Inputs
  readonly isOpen = input<boolean>(false);
  readonly user = input<any | null>(null); // TODO: Replace with UserDto
  readonly clubs = input<any[]>([]); // TODO: Replace with ClubDto[]
  readonly activeContext = input<{ type: 'solo' | 'club'; clubId: string | null }>({
    type: 'solo',
    clubId: null,
  });

  // Outputs
  readonly close = output<void>();
  readonly contextSelected = output<{ type: 'solo' | 'club'; id: string | null; club?: any }>();
  readonly createJoinClub = output<void>();

  /**
   * Get classes for context item button
   */
  getContextItemClasses(type: 'solo' | 'club', clubId?: string): string {
    const isActive =
      type === 'solo'
        ? this.activeContext().type === 'solo'
        : this.activeContext().type === 'club' && this.activeContext().clubId === clubId;

    return clsx(
      'flex w-full items-center gap-3 rounded-lg p-3',
      'transition-all duration-200',
      'hover:bg-smoke-700',
      'active:scale-95',
      isActive
        ? 'bg-smoke-700 ring-2 ring-gold-500/30'
        : 'bg-smoke-750'
    );
  }

  /**
   * Select solo context
   */
  selectSolo(): void {
    this.contextSelected.emit({ type: 'solo', id: null });
    this.close.emit();
  }

  /**
   * Select club context
   */
  selectClub(club: any): void {
    this.contextSelected.emit({ type: 'club', id: club.id, club });
    this.close.emit();
  }
}
