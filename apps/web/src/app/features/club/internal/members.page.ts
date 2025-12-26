import { Component, signal, computed, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ContextStore } from '../../../core/stores/context.store';
import { ClubsService } from '@cigar-platform/types/lib/clubs/clubs.service';
import type { UpdateMemberRoleDtoRole } from '@cigar-platform/types';

// TODO: Replace with proper ClubMemberResponseDto once API types are generated
interface ClubMember {
  userId: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: string | Date;
  user?: {
    id: string;
    displayName?: string;
    avatarUrl?: string;
    email?: string;
  };
}
import {
  PageHeaderComponent,
  PageSectionComponent,
  ButtonComponent,
  AvatarComponent,
} from '@cigar-platform/shared/ui';

/**
 * Club Members Page (Internal)
 *
 * Route: /membres
 * Accessible: Only when context = club
 * Context-driven: Uses ContextStore.clubId
 *
 * Features:
 * - View club members list
 * - Admin: Update member roles
 * - Admin: Remove/ban members
 * - View pending join requests (admin)
 *
 * Architecture: ALL STARS ⭐
 * - Template in separate .html file
 * - Clean separation of concerns
 * - NOT nested under /club/:id
 * - Slack/Discord style navigation
 * - Context selects the page, page never decides context
 */
@Component({
  selector: 'app-members',
  standalone: true,
  imports: [
    CommonModule,
    PageHeaderComponent,
    PageSectionComponent,
    ButtonComponent,
    AvatarComponent,
  ],
  templateUrl: './members.page.html',
})
export class MembersPage {
  contextStore = inject(ContextStore);
  #router = inject(Router);
  #clubsService = inject(ClubsService);

  // State
  #members = signal<ClubMember[]>([]);
  loading = signal<boolean>(true);

  // Computed - Read-only members list
  readonly members = this.#members.asReadonly();

  // Computed - Members by role
  readonly ownerMembers = computed(() =>
    this.#members().filter((m) => m.role === 'owner')
  );

  readonly adminMembers = computed(() =>
    this.#members().filter((m) => m.role === 'admin')
  );

  readonly regularMembers = computed(() =>
    this.#members().filter((m) => m.role === 'member')
  );

  constructor() {
    // Load members when context changes
    effect(() => {
      const context = this.contextStore.context();
      if (context.type === 'club' && context.clubId) {
        this.loadMembers(context.clubId);
      }
    });
  }

  /**
   * Load club members from API
   */
  async loadMembers(clubId: string): Promise<void> {
    this.loading.set(true);

    try {
      const response: any = await this.#clubsService.clubControllerGetMembers(clubId, {
        limit: 100,
        page: 1,
      });

      if (response?.data) {
        this.#members.set(response.data);
      } else {
        this.#members.set([]);
      }
    } catch (error) {
      console.error('[MembersPage] Failed to load members:', error);
      this.#members.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Manage member (update role, remove, ban)
   * Only accessible to club admins
   */
  onManageMember(member: ClubMember): void {
    // TODO: Open manage member modal
    console.log('[MembersPage] Manage member:', member);
  }

  /**
   * Navigate to explore page
   */
  goToExplore(): void {
    this.#router.navigate(['/explore']);
  }

  /**
   * Format date for display
   */
  formatDate(date: string | Date): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
}
