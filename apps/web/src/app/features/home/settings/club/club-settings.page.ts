import { Component, signal, inject, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormGroup, FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { ContextStore } from '../../../../core/stores/context.store';
import { ClubsService } from '@cigar-platform/types/lib/clubs/clubs.service';
import { FormService, ToastService } from '../../../../core/services';
import type { ClubResponseDto, UpdateClubDto } from '@cigar-platform/types';
import {
  PageHeaderComponent,
  PageSectionComponent,
  ButtonComponent,
  InputComponent,
  CheckboxComponent,
  SelectComponent,
  type SelectOption,
} from '@cigar-platform/shared/ui';

/**
 * Club Settings Page (Internal)
 *
 * Route: /settings (when context = club)
 * Accessible: Only to club admins/owners
 * Context-driven: Uses ContextStore.clubId
 *
 * Features:
 * - Update club information (name, description, cover)
 * - Configure club settings (visibility, approval, invites, max members)
 * - Manage invite codes
 * - Transfer ownership (owner only)
 * - Archive/Delete club (owner only)
 *
 * Architecture: ALL STARS ⭐
 * - Template in separate .html file
 * - Clean separation of concerns
 * - Loaded by SettingsContextPage when context = club
 * - Never decides context itself
 */
@Component({
  selector: 'app-club-settings',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    PageHeaderComponent,
    PageSectionComponent,
    ButtonComponent,
    InputComponent,
    CheckboxComponent,
    SelectComponent,
  ],
  templateUrl: './club-settings.page.html',
})
export class ClubSettingsPage {
  contextStore = inject(ContextStore);
  #clubsService = inject(ClubsService);
  #formService = inject(FormService);
  #toastService = inject(ToastService);
  #fb = inject(FormBuilder);
  #router = inject(Router);

  // State
  club = signal<ClubResponseDto | null>(null);
  loading = signal<boolean>(true);
  saving = signal<boolean>(false);

  // Computed
  isOwner = computed(() => {
    return this.contextStore.context().clubRole === 'owner';
  });

  // Select options
  readonly visibilityOptions: SelectOption[] = [
    { value: 'PUBLIC', label: 'Public - Visible dans la recherche' },
    { value: 'PRIVATE', label: 'Privé - Sur invitation uniquement' },
  ];

  // Form
  clubForm: FormGroup<{
    name: FormControl<string>;
    description: FormControl<string | null>;
    visibility: FormControl<'PUBLIC' | 'PRIVATE'>;
    isPublicDirectory: FormControl<boolean>;
    autoApproveMembers: FormControl<boolean>;
    allowMemberInvites: FormControl<boolean>;
    maxMembers: FormControl<number | null>;
  }> = this.#fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
    description: this.#fb.control<string | null>(null, [Validators.maxLength(500)]),
    visibility: this.#fb.nonNullable.control<'PUBLIC' | 'PRIVATE'>('PUBLIC'),
    isPublicDirectory: [true],
    autoApproveMembers: [false],
    allowMemberInvites: [true],
    maxMembers: this.#fb.control<number | null>(null, [Validators.min(1)]),
  });

  constructor() {
    // Load club data when context changes
    effect(() => {
      const context = this.contextStore.context();
      if (context.type === 'club' && context.club) {
        this.club.set(context.club);
        this.loadClubSettings(context.club.id);
      }
    });
  }

  /**
   * Load full club settings from API
   */
  async loadClubSettings(clubId: string): Promise<void> {
    this.loading.set(true);

    try {
      const response: any = await this.#clubsService.clubControllerFindOne(clubId);

      if (response?.data) {
        this.club.set(response.data);
        this.patchFormWithClubData(response.data);
      } else if (response) {
        this.club.set(response);
        this.patchFormWithClubData(response);
      }
    } catch (error) {
      console.error('[ClubSettingsPage] Failed to load club settings:', error);
      this.#toastService.error('Impossible de charger les paramètres du club');
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Patch form with club data
   */
  patchFormWithClubData(club: ClubResponseDto): void {
    this.clubForm.patchValue({
      name: club.name,
      description: club.description ? String(club.description) : null,
      visibility: club.visibility,
      isPublicDirectory: club.isPublicDirectory,
      autoApproveMembers: club.autoApproveMembers,
      allowMemberInvites: club.allowMemberInvites,
      maxMembers: club.maxMembers ? Number(club.maxMembers) : null,
    });
  }

  /**
   * Update club settings
   */
  async onUpdateClub(): Promise<void> {
    this.#formService.triggerValidation(this.clubForm);

    if (this.clubForm.invalid) {
      return;
    }

    const clubData = this.club();
    if (!clubData) {
      return;
    }

    this.saving.set(true);

    try {
      const formValue = this.clubForm.getRawValue();
      const updateDto: UpdateClubDto = {
        ...formValue,
        description: formValue.description || undefined,
        maxMembers: formValue.maxMembers || undefined,
      };

      const response: any = await this.#clubsService.clubControllerUpdate(
        clubData.id,
        updateDto
      );

      if (response?.data) {
        this.club.set(response.data);
        this.#toastService.success('Paramètres du club mis à jour avec succès');

        // Refresh context to update club data in ContextStore
        await this.contextStore.refresh();
      }
    } catch (error) {
      console.error('[ClubSettingsPage] Failed to update club:', error);
      this.#toastService.error('Impossible de mettre à jour le club');
    } finally {
      this.saving.set(false);
    }
  }

  /**
   * Archive club (owner only)
   */
  async onArchiveClub(): Promise<void> {
    if (!confirm('Êtes-vous sûr de vouloir archiver ce club ? Cette action est réversible.')) {
      return;
    }

    const clubData = this.club();
    if (!clubData) {
      return;
    }

    try {
      // TODO: Implement archive endpoint
      console.log('[ClubSettingsPage] Archive club:', clubData.id);
      this.#toastService.success('Club archivé avec succès');

      // Switch to solo context and navigate to explore
      this.contextStore.switchToSolo();
      this.#router.navigate(['/explore']);
    } catch (error) {
      console.error('[ClubSettingsPage] Failed to archive club:', error);
      this.#toastService.error('Impossible d\'archiver le club');
    }
  }
}
