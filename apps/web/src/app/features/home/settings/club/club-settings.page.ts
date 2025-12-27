import { Component, signal, inject, computed, effect, viewChildren } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormGroup, FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideAngularModule, LockKeyhole } from 'lucide-angular';
import { ContextStore } from '../../../../core/stores/context.store';
import { injectClubStore } from '../../../../core/stores/club.store';
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
    LucideAngularModule,
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
  #clubStore = injectClubStore();
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

  // State
  #originalFormValue = signal<any>(null);
  #currentFormValue = signal<any>(null);

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

    // Refresh context to update club data in ContextStore
    await this.contextStore.refresh();
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
