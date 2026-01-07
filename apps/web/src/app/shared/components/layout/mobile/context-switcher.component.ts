import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AvatarComponent, IconDirective, LogoComponent, ModalComponent } from '@cigar-platform/shared/ui';
import clsx from 'clsx';

/**
 * Context Switcher Component (Mobile Bottom Sheet)
 * Clean unified list for context switching
 */
@Component({
  selector: 'app-context-switcher',
  standalone: true,
  imports: [CommonModule, AvatarComponent, IconDirective, LogoComponent, ModalComponent],
  template: `
    <ui-modal
      [isOpen]="isOpen()"
      variant="bottomSheet"
      size="md"
      [showCloseButton]="false"
      (close)="close.emit()"
    >
      <div class="pb-6 md:hidden" style="padding-bottom: calc(1.5rem + env(safe-area-inset-bottom))">
        <!-- Friendly header -->
        <p class="mb-4 text-sm text-smoke-300">Choisir un espace</p>

        <!-- Unified list with contrasted border -->
        <div class="overflow-hidden rounded-xl border border-smoke-500 py-2">
          <!-- Solo Context -->
          <button
            type="button"
            (click)="selectSolo()"
            [class]="getContextItemClasses('solo')"
          >
            <ui-avatar [user]="user()" size="md" />
            <div class="flex-1 text-left">
              <div class="font-medium text-smoke-50">{{ user()?.displayName || 'Mon profil' }}</div>
              <div class="text-xs text-smoke-300">Personnel</div>
            </div>
            @if (activeContext().type === 'solo') {
              <i name="check" class="h-5 w-5 text-gold-500"></i>
            }
          </button>

          <!-- Clubs -->
          @for (club of clubs(); track club.id) {
            <button
              type="button"
              (click)="selectClub(club)"
              [class]="getContextItemClasses('club', club.id)"
            >
              <ui-avatar [club]="club" size="md" />
              <div class="flex-1 text-left">
                <div class="font-medium text-smoke-50">{{ club.name }}</div>
                <div class="text-xs text-smoke-300">Club {{ club.memberCount || 0 }} membres</div>
              </div>
              @if (activeContext().type === 'club' && activeContext().clubId === club.id) {
                <i name="check" class="h-5 w-5 text-gold-500"></i>
              }
            </button>
          }
        </div>

        <!-- Create/Join Club Links -->
        <div class="mt-4 flex items-center justify-between px-2">
          <button
            type="button"
            (click)="createClub.emit(); close.emit()"
            class="text-sm font-medium text-gold-500 transition-colors hover:text-gold-400"
          >
            Créer un club
          </button>
          <button
            type="button"
            (click)="joinClub.emit(); close.emit()"
            class="text-sm font-medium text-gold-500 transition-colors hover:text-gold-400"
          >
            Rejoindre un club
          </button>
        </div>

        <!-- App Logo -->
        <div class="mt-6 flex justify-center opacity-50">
          <ui-logo variant="full" size="sm" [showTagline]="false" />
        </div>
      </div>
    </ui-modal>
  `,
})
export class ContextSwitcherComponent {
  // Inputs
  readonly isOpen = input<boolean>(false);
  readonly user = input<any | null>(null);
  readonly clubs = input<any[]>([]);
  readonly activeContext = input<{ type: 'solo' | 'club'; clubId: string | null }>({
    type: 'solo',
    clubId: null,
  });

  // Outputs
  readonly close = output<void>();
  readonly contextSelected = output<{ type: 'solo' | 'club'; id: string | null; club?: any }>();
  readonly createClub = output<void>();
  readonly joinClub = output<void>();

  /**
   * Get classes for context item button
   * Clean seamless design - items flow naturally with subtle hover
   */
  getContextItemClasses(type: 'solo' | 'club', clubId?: string): string {
    const isActive =
      type === 'solo'
        ? this.activeContext().type === 'solo'
        : this.activeContext().type === 'club' && this.activeContext().clubId === clubId;

    return clsx(
      'flex w-full items-center gap-3 px-4 py-3',
      'transition-colors duration-200',
      'hover:bg-smoke-700/50',
      'active:scale-[0.98]',
      isActive && 'bg-smoke-700/30'
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