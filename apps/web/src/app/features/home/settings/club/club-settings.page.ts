import { Component, signal, inject, computed, effect, viewChildren } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormGroup, FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideAngularModule, LockKeyhole } from 'lucide-angular';
import { ContextStore } from '../../../../core/stores/context.store';
import { injectClubStore } from '../../../../core/stores/club.store';
import { FormService, ToastService, AuthService } from '../../../../core/services';
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
import { ConfirmationModalComponent } from '../../../../shared/components/confirmation-modal/confirmation-modal.component';

/**
 * Club Settings Form Value Interface
 */
interface ClubSettingsFormValue {
  name: string;
  description: string | null;
  visibility: 'PUBLIC' | 'PRIVATE';
  isPublicDirectory: boolean;
  autoApproveMembers: boolean;
  allowMemberInvites: boolean;
  maxMembers: number | null;
}

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
    LucideAngularModule,
    PageHeaderComponent,
    PageSectionComponent,
    ButtonComponent,
    InputComponent,
    CheckboxComponent,
    SelectComponent,
    ConfirmationModalComponent,
  ],
  templateUrl: './club-settings.page.html',
})
export class ClubSettingsPage {
  contextStore = inject(ContextStore);
  #clubStore = injectClubStore();
  #authService = inject(AuthService);
  readonly LockKeyhole = LockKeyhole;
  #formService = inject(FormService);
  #toastService = inject(ToastService);
  #fb = inject(FormBuilder);
  #router = inject(Router);

  // ViewChildren for form components
  inputs = viewChildren(InputComponent);
  selects = viewChildren(SelectComponent);

  // Context ID
  readonly clubId = signal<string>('');

  // Reactive query with getter pattern
  readonly clubQuery = this.#clubStore.getClubById(() => this.clubId());

  // Computed states - extract signals from query
  readonly loading = this.clubQuery.loading;
  readonly error = this.clubQuery.error;
  readonly club = this.clubQuery.data;

  // Mutation loading state
  readonly updateClubLoading = this.#clubStore.updateClub.loading;
  readonly leavingClub = this.#clubStore.removeMember.loading;

  // Confirmation modals
  readonly showLeaveConfirm = signal<boolean>(false);
  readonly showArchiveConfirm = signal<boolean>(false);

  // State
  #originalFormValue = signal<ClubSettingsFormValue | null>(null);
  #currentFormValue = signal<ClubSettingsFormValue | null>(null);

  // Computed
  isOwner = computed(() => {
    return this.contextStore.context().clubRole === 'owner';
  });

  // Track if form has unsaved changes (reactive!)
  hasUnsavedChanges = computed<boolean>(() => {
    const original = this.#originalFormValue();
    const current = this.#currentFormValue();

    if (!original || !current) return false;

    // Deep comparison of form values
    return (
      original.name !== current.name ||
      original.description !== current.description ||
      original.visibility !== current.visibility ||
      original.isPublicDirectory !== current.isPublicDirectory ||
      original.autoApproveMembers !== current.autoApproveMembers ||
      original.allowMemberInvites !== current.allowMemberInvites ||
      original.maxMembers !== current.maxMembers
    );
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
    // Guard: Redirect if user doesn't have access to settings
    effect(() => {
      const context = this.contextStore.context();
      // All club roles (member, admin, owner) can access settings
      // Members can leave, admins can edit description, owners have full access
      if (context.type === 'club' && !this.contextStore.canAccessSettings()) {
        console.warn('[ClubSettingsPage] User does not have access to settings, redirecting to home');
        void this.#router.navigate(['/']);
      }
    });

    // Update club ID from context
    effect(() => {
      const context = this.contextStore.context();
      if (context.type === 'club' && context.clubId) {
        this.clubId.set(context.clubId);
      } else {
        this.clubId.set('');
      }
    });

    // Watch club data and patch form when loaded
    effect(() => {
      const clubData = this.club();
      if (clubData) {
        this.patchFormWithClubData(clubData);
      }
    });

    // Track form changes reactively
    effect((onCleanup) => {
      const subscription = this.clubForm.valueChanges.subscribe(() => {
        this.#currentFormValue.set(this.clubForm.getRawValue());
      });

      onCleanup(() => subscription.unsubscribe());
    });

    // Control form fields based on permissions
    effect(() => {
      const canEditCritical = this.contextStore.canEditCriticalSettings();
      const canManage = this.contextStore.canManageClub();

      if (canEditCritical) {
        // Owner: All fields enabled
        this.clubForm.controls.name.enable({ emitEvent: false });
        this.clubForm.controls.description.enable({ emitEvent: false });
        this.clubForm.controls.visibility.enable({ emitEvent: false });
        this.clubForm.controls.isPublicDirectory.enable({ emitEvent: false });
        this.clubForm.controls.autoApproveMembers.enable({ emitEvent: false });
        this.clubForm.controls.allowMemberInvites.enable({ emitEvent: false });
        this.clubForm.controls.maxMembers.enable({ emitEvent: false });
      } else if (canManage) {
        // Admin: Only description enabled
        this.clubForm.controls.name.disable({ emitEvent: false });
        this.clubForm.controls.description.enable({ emitEvent: false });
        this.clubForm.controls.visibility.disable({ emitEvent: false });
        this.clubForm.controls.isPublicDirectory.disable({ emitEvent: false });
        this.clubForm.controls.autoApproveMembers.disable({ emitEvent: false });
        this.clubForm.controls.allowMemberInvites.disable({ emitEvent: false });
        this.clubForm.controls.maxMembers.disable({ emitEvent: false });
      } else {
        // Member: All fields disabled
        this.clubForm.controls.name.disable({ emitEvent: false });
        this.clubForm.controls.description.disable({ emitEvent: false });
        this.clubForm.controls.visibility.disable({ emitEvent: false });
        this.clubForm.controls.isPublicDirectory.disable({ emitEvent: false });
        this.clubForm.controls.autoApproveMembers.disable({ emitEvent: false });
        this.clubForm.controls.allowMemberInvites.disable({ emitEvent: false });
        this.clubForm.controls.maxMembers.disable({ emitEvent: false });
      }
    });
  }

  /**
   * Patch form with club data
   */
  patchFormWithClubData(club: ClubResponseDto): void {
    const formValue = {
      name: club.name,
      description: club.description ? String(club.description) : null,
      visibility: club.visibility,
      isPublicDirectory: club.isPublicDirectory,
      autoApproveMembers: club.autoApproveMembers,
      allowMemberInvites: club.allowMemberInvites,
      maxMembers: club.maxMembers ? Number(club.maxMembers) : null,
    };

    this.clubForm.patchValue(formValue);

    // Store both original and current values for dirty tracking
    const rawValue = this.clubForm.getRawValue();
    this.#originalFormValue.set(rawValue);
    this.#currentFormValue.set(rawValue);
  }

  /**
   * Cancel pending changes and reset form to original values
   */
  onCancelChanges(): void {
    const original = this.#originalFormValue();
    if (original) {
      this.clubForm.patchValue(original);
      this.clubForm.markAsPristine();
      this.clubForm.markAsUntouched();
      // Update current value to match original (will be synced by valueChanges)
      this.#currentFormValue.set(original);
    }
  }

  /**
   * Update club settings
   */
  async onUpdateClub(): Promise<void> {
    this.#formService.triggerValidation(this.clubForm);

    // Force show errors on all UI components
    this.inputs().forEach((input) => input.forceShowError());
    this.selects().forEach((select) => select.forceShowError());

    if (this.clubForm.invalid) {
      return;
    }

    const clubData = this.club();
    if (!clubData) {
      return;
    }

    const formValue = this.clubForm.getRawValue();
    const updateDto: UpdateClubDto = {
      ...formValue,
      description: formValue.description || undefined,
      maxMembers: formValue.maxMembers || undefined,
    };

    // Store handles API + invalidation
    await this.#clubStore.updateClub.mutate({
      id: clubData.id,
      data: updateDto,
    });

    // Component handles UX only
    if (this.#clubStore.updateClub.error()) {
      this.#toastService.error('Impossible de mettre à jour le club');
      return;
    }

    this.#toastService.success('Paramètres du club mis à jour avec succès');

    // Update both original and current values after successful save
    const savedValue = this.clubForm.getRawValue();
    this.#originalFormValue.set(savedValue);
    this.#currentFormValue.set(savedValue);
    this.clubForm.markAsPristine();

    // Update context with fresh club data (optimistic, no API call)
    const updatedClubData = this.club();
    if (updatedClubData) {
      this.contextStore.updateCurrentClub(updatedClubData);
    }
  }

  /**
   * Archive club (owner only)
   * Shows confirmation modal first
   */
  onArchiveClub(): void {
    this.showArchiveConfirm.set(true);
  }

  /**
   * Confirm archive club
   * Archives the club and switches to solo context
   */
  async onConfirmArchiveClub(): Promise<void> {
    const clubData = this.club();
    if (!clubData) {
      return;
    }

    // Close modal
    this.showArchiveConfirm.set(false);

    try {
      // TODO: Implement archive endpoint
      console.log('[ClubSettingsPage] Archive club:', clubData.id);
      this.#toastService.success('Club archivé avec succès');

      // Switch to solo context and navigate to explore
      this.contextStore.switchToSolo();
      await this.#router.navigate(['/explore']);
    } catch (error) {
      console.error('[ClubSettingsPage] Failed to archive club:', error);
      this.#toastService.error('Impossible d\'archiver le club');
    }
  }

  /**
   * Leave club (admin/member only)
   * Shows confirmation modal first
   */
  onLeaveClub(): void {
    this.showLeaveConfirm.set(true);
  }

  /**
   * Confirm leave club
   * Removes current user from club and switches to solo context
   */
  async onConfirmLeaveClub(): Promise<void> {
    // Lock: Prevent double-click
    if (this.#clubStore.removeMember.loading()) return;

    const clubData = this.club();
    const currentUser = this.#authService.currentUser();

    if (!clubData || !currentUser) {
      return;
    }

    // Close modal
    this.showLeaveConfirm.set(false);

    // Remove current user from club
    await this.#clubStore.removeMember.mutate({
      clubId: clubData.id,
      userId: currentUser.id,
    });

    if (this.#clubStore.removeMember.error()) {
      this.#toastService.error('Impossible de quitter le club');
      return;
    }

    this.#toastService.success(`Vous avez quitté ${clubData.name}`);

    // Refresh user clubs to remove from available contexts
    await this.contextStore.loadUserClubs();

    // Switch to solo context
    this.contextStore.switchToSolo();

    // Navigate to home
    void this.#router.navigate(['/']);
  }
}
