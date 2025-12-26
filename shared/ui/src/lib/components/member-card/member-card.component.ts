import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AvatarComponent } from '../avatar';
import { ButtonComponent } from '../button';

/**
 * Member Card Component
 *
 * Themed card for displaying club member information
 *
 * Design System:
 * - Smoke-850/900 backgrounds (consistent with app theme)
 * - Gold-500 accents for hover states
 * - Role-specific badge colors (purple for owner, blue for admin, smoke for member)
 * - Smooth transitions and hover effects
 *
 * @example
 * ```html
 * <ui-member-card
 *   [member]="member"
 *   [canManage]="contextStore.canManageClub()"
 *   (manageClick)="handleManageMember($event)"
 * />
 * ```
 */

export type MemberRole = 'owner' | 'admin' | 'member';

// Generic member interface compatible with various API types
export interface MemberCardUser {
  userId: string;
  role: MemberRole;
  joinedAt: string | Date;
  user?: {
    id: string;
    displayName?: string;
    avatarUrl?: string;
    email?: string;
  } | null | undefined;
}

const CLASSES = {
  card: {
    base: 'group flex items-center justify-between p-5 rounded-xl border-2 transition-all duration-300',
    background: 'bg-smoke-850',
    border: 'border-smoke-700 hover:border-gold-500/30',
    shadow: 'shadow-sm hover:shadow-lg hover:shadow-gold-500/5',
  },
  content: {
    container: 'flex items-center gap-4 min-w-0 flex-1',
    info: 'min-w-0 flex-1',
    name: 'font-semibold text-smoke-100 truncate group-hover:text-gold-500 transition-colors duration-200',
    date: 'text-sm text-smoke-400 mt-0.5',
  },
  actions: {
    container: 'flex items-center gap-3 shrink-0',
  },
  badge: {
    base: 'px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide whitespace-nowrap',
    owner: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
    admin: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
    member: 'bg-smoke-700/50 text-smoke-300 border border-smoke-600/30',
  },
  glowEffect: 'absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none bg-gradient-to-r from-gold-500/3 to-transparent rounded-xl',
} as const;

const ROLE_LABELS: Record<MemberRole, string> = {
  owner: 'Propriétaire',
  admin: 'Administrateur',
  member: 'Membre',
} as const;

@Component({
  selector: 'ui-member-card',
  standalone: true,
  imports: [CommonModule, AvatarComponent, ButtonComponent],
  template: `
    <div [class]="cardClasses" class="relative overflow-hidden">
      <!-- Hover glow effect -->
      <div [class]="CLASSES.glowEffect"></div>

      <!-- Content: Avatar + Info -->
      <div [class]="CLASSES.content.container">
        <ui-avatar
          [user]="$any(member().user) || null"
          size="md"
        />
        <div [class]="CLASSES.content.info">
          <div [class]="CLASSES.content.name">
            {{ member().user?.displayName || 'Utilisateur' }}
          </div>
          <div [class]="CLASSES.content.date">
            Membre depuis {{ formattedDate }}
          </div>
        </div>
      </div>

      <!-- Actions: Role Badge + Manage Button -->
      <div [class]="CLASSES.actions.container">
        <span [class]="roleBadgeClasses">
          {{ roleLabel }}
        </span>
        @if (canManage()) {
          <ui-button
            (click)="onManageClick()"
            variant="ghost"
            size="sm"
          >
            Gérer
          </ui-button>
        }
      </div>
    </div>
  `,
})
export class MemberCardComponent {
  // Inputs
  readonly member = input.required<MemberCardUser>();
  readonly canManage = input<boolean>(false);

  // Outputs
  readonly manageClick = output<MemberCardUser>();

  // Class constants (expose for template)
  readonly CLASSES = CLASSES;

  // Computed classes
  get cardClasses(): string {
    return [
      CLASSES.card.base,
      CLASSES.card.background,
      CLASSES.card.border,
      CLASSES.card.shadow,
    ].join(' ');
  }

  get roleBadgeClasses(): string {
    const role = this.member().role;
    const roleClass = role === 'owner'
      ? CLASSES.badge.owner
      : role === 'admin'
      ? CLASSES.badge.admin
      : CLASSES.badge.member;

    return [CLASSES.badge.base, roleClass].join(' ');
  }

  get roleLabel(): string {
    return ROLE_LABELS[this.member().role];
  }

  get formattedDate(): string {
    const date = this.member().joinedAt;
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  // Event handlers
  onManageClick(): void {
    this.manageClick.emit(this.member());
  }
}
