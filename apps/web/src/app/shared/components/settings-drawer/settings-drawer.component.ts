import { Component, input, output, inject, signal, computed, effect, viewChildren } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormGroup, FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { take } from 'rxjs/operators';
import {
  ModalComponent,
  IconDirective,
  ButtonComponent,
  InputComponent,
  AvatarUploadComponent,
  SwitchComponent,
  SelectComponent,
  CheckboxComponent,
  LogoComponent,
  SkeletonComponent,
  type SelectOption,
} from '@cigar-platform/shared/ui';
import { environment } from '../../../../environments/environment';
import { AuthService, FormService, ToastService, PlanService } from '../../../core/services';
import { injectUserStore, UserStore } from '../../../core/stores';
import { injectClubStore } from '../../../core/stores/club.store';
import { ContextStore } from '../../../core/stores/context.store';
import { ConfirmationModalComponent } from '../confirmation-modal/confirmation-modal.component';
import { FeedbackModalComponent } from '../feedback-modal/feedback-modal.component';
import { usernameAvailabilityValidator } from '../../../core/validators/username-availability.validator';
import type { ClubResponseDto, UpdateClubDto } from '@cigar-platform/types';

/**
 * User Profile Form Value Interface
 */
interface UserProfileFormValue {
  displayName: string;
  username: string;
  bio: string | null;
}

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
 * Settings Drawer Component
 * Slide-over panel from right displaying contextualized settings
 * - Solo context: User profile settings
 * - Club context: Club settings (based on role permissions)
 */
@Component({
  selector: 'app-settings-drawer',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ModalComponent,
    IconDirective,
    ButtonComponent,
    InputComponent,
    AvatarUploadComponent,
    SwitchComponent,
    SelectComponent,
    CheckboxComponent,
    LogoComponent,
    SkeletonComponent,
    ConfirmationModalComponent,
    FeedbackModalComponent,
  ],
  templateUrl: './settings-drawer.component.html',
})
export class SettingsDrawerComponent {
  // Inputs/Outputs
  readonly isOpen = input<boolean>(false);
  readonly close = output<void>();

  // Services
  readonly #authService = inject(AuthService);
  readonly #formService = inject(FormService);
  readonly #toastService = inject(ToastService);
  readonly #fb = inject(FormBuilder);
  readonly #router = inject(Router);
  readonly planService = inject(PlanService);

  // Stores
  readonly contextStore = inject(ContextStore);
  readonly userStore: UserStore = injectUserStore();
  readonly clubStore = injectClubStore();

  // Context
  readonly isSoloContext = computed(() => this.contextStore.context().type === 'solo');
  readonly isClubContext = computed(() => this.contextStore.context().type === 'club');

  // App version
  readonly appVersion = environment.version;

  // ===== USER (SOLO) SETTINGS =====
  readonly currentUser = this.userStore.currentUser.data;

  readonly profileUrl = computed(() => {
    const user = this.currentUser();
    if (!user) return '';
    return `${window.location.origin}/user/@${user.username}`;
  });

  readonly usernameErrorMessages = {
    pattern: () => 'Uniquement minuscules, chiffres, points (.) et underscores (_)',
    minlength: () => 'Minimum 3 caractères',
    maxlength: () => 'Maximum 30 caractères',
    usernameTaken: () => "Ce nom d'utilisateur est déjà pris",
  };

  readonly isOAuthUser = computed(() => {
    const provider = this.currentUser()?.authProvider;
    return provider === 'google' || provider === 'apple';
  });

  readonly providerLabel = computed(() => {
    const provider = this.currentUser()?.authProvider;
    switch (provider) {
      case 'google':
        return 'Google';
      case 'apple':
        return 'Apple';
      default:
        return 'Email';
    }
  });

  // User form
  readonly profileForm: FormGroup<{
    displayName: FormControl<string>;
    username: FormControl<string>;
    bio: FormControl<string | null>;
  }> = this.#fb.nonNullable.group({
    displayName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    username: [
      '',
      [Validators.required, Validators.minLength(3), Validators.maxLength(30), Validators.pattern(/^[a-z0-9._]{3,30}$/)],
    ],
    bio: this.#fb.control<string | null>(null, [Validators.maxLength(500)]),
  });

  // Standalone switches with auto-save
  readonly visibilitySwitch: FormControl<boolean> = this.#fb.nonNullable.control<boolean>(true);
  readonly shareEvaluationsSwitch: FormControl<boolean> = this.#fb.nonNullable.control<boolean>(true);

  // Form state tracking
  #userOriginalFormValue = signal<UserProfileFormValue | null>(null);
  #userCurrentFormValue = signal<UserProfileFormValue | null>(null);

  readonly userHasUnsavedChanges = computed(() => {
    const original = this.#userOriginalFormValue();
    const current = this.#userCurrentFormValue();
    if (!original || !current) return false;
    return (
      original.displayName !== current.displayName ||
      original.username !== current.username ||
      original.bio !== current.bio
    );
  });

  // Loading states
  readonly #logoutLoading = signal<boolean>(false);
  readonly logoutLoading = this.#logoutLoading.asReadonly();

  // Modals
  readonly showLogoutConfirm = signal<boolean>(false);
  readonly showFeedbackModal = signal<boolean>(false);

  // ===== CLUB SETTINGS =====
  readonly clubId = signal<string>('');
  readonly clubQuery = this.clubStore.getClubById(() => this.clubId());
  readonly club = this.clubQuery.data;
  readonly clubLoading = this.clubQuery.loading;

  readonly isOwner = computed(() => this.contextStore.context().clubRole === 'owner');

  readonly clubUrl = computed(() => {
    const clubData = this.club();
    if (!clubData) return '';
    return `${window.location.origin}/club/${clubData.slug}`;
  });

  // Club form
  readonly clubForm: FormGroup<{
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

  readonly visibilityOptions: SelectOption[] = [
    { value: 'PUBLIC', label: 'Public - Visible dans la recherche' },
    { value: 'PRIVATE', label: 'Privé - Sur invitation uniquement' },
  ];

  // Club form state tracking
  #clubOriginalFormValue = signal<ClubSettingsFormValue | null>(null);
  #clubCurrentFormValue = signal<ClubSettingsFormValue | null>(null);

  readonly clubHasUnsavedChanges = computed(() => {
    const original = this.#clubOriginalFormValue();
    const current = this.#clubCurrentFormValue();
    if (!original || !current) return false;
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

  // Club modals
  readonly showLeaveConfirm = signal<boolean>(false);
  readonly showArchiveConfirm = signal<boolean>(false);

  // ViewChildren
  inputs = viewChildren(InputComponent);
  selects = viewChildren(SelectComponent);

  constructor() {
    // Add async validator to username control
    const userId = this.currentUser()?.id;
    this.profileForm.controls.username.setAsyncValidators([usernameAvailabilityValidator(userId, 500)]);

    // Sync user profile form with user data
    effect(() => {
      const user = this.currentUser();
      if (user) {
        this.profileForm.patchValue(
          {
            displayName: user.displayName,
            username: user.username ?? '',
            bio: user.bio ?? null,
          },
          { emitEvent: false }
        );
        const formValue = this.profileForm.getRawValue();
        this.#userOriginalFormValue.set(formValue);
        this.#userCurrentFormValue.set(formValue);
      }
    });

    // Sync standalone switches with user data
    effect(() => {
      const user = this.currentUser();
      if (user) {
        const visibility = user.visibility ?? 'PUBLIC';
        this.visibilitySwitch.setValue(visibility === 'PUBLIC', { emitEvent: false });
        this.shareEvaluationsSwitch.setValue(user.shareEvaluationsPublicly ?? true, { emitEvent: false });
      }
    });

    // Auto-save visibility switch
    effect((onCleanup) => {
      const subscription = this.visibilitySwitch.valueChanges.subscribe((isPublic) => {
        this.onVisibilityToggle(isPublic);
      });
      onCleanup(() => subscription.unsubscribe());
    });

    // Auto-save shareEvaluations switch
    effect((onCleanup) => {
      const subscription = this.shareEvaluationsSwitch.valueChanges.subscribe((sharePublicly) => {
        this.onShareEvaluationsToggle(sharePublicly);
      });
      onCleanup(() => subscription.unsubscribe());
    });

    // Track user form changes
    effect((onCleanup) => {
      const subscription = this.profileForm.valueChanges.subscribe(() => {
        this.#userCurrentFormValue.set(this.profileForm.getRawValue());
      });
      onCleanup(() => subscription.unsubscribe());
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

    // Sync club form with club data
    effect(() => {
      const clubData = this.club();
      if (clubData) {
        this.patchClubFormWithData(clubData);
      }
    });

    // Track club form changes
    effect((onCleanup) => {
      const subscription = this.clubForm.valueChanges.subscribe(() => {
        this.#clubCurrentFormValue.set(this.clubForm.getRawValue());
      });
      onCleanup(() => subscription.unsubscribe());
    });

    // Control club form fields based on permissions
    effect(() => {
      const canEditCritical = this.contextStore.canEditCriticalSettings();
      const canManage = this.contextStore.canManageClub();

      if (canEditCritical) {
        this.clubForm.controls.name.enable({ emitEvent: false });
        this.clubForm.controls.description.enable({ emitEvent: false });
        this.clubForm.controls.visibility.enable({ emitEvent: false });
        this.clubForm.controls.isPublicDirectory.enable({ emitEvent: false });
        this.clubForm.controls.autoApproveMembers.enable({ emitEvent: false });
        this.clubForm.controls.allowMemberInvites.enable({ emitEvent: false });
        this.clubForm.controls.maxMembers.enable({ emitEvent: false });
      } else if (canManage) {
        this.clubForm.controls.name.disable({ emitEvent: false });
        this.clubForm.controls.description.enable({ emitEvent: false });
        this.clubForm.controls.visibility.disable({ emitEvent: false });
        this.clubForm.controls.isPublicDirectory.disable({ emitEvent: false });
        this.clubForm.controls.autoApproveMembers.disable({ emitEvent: false });
        this.clubForm.controls.allowMemberInvites.disable({ emitEvent: false });
        this.clubForm.controls.maxMembers.disable({ emitEvent: false });
      } else {
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

  // ===== USER METHODS =====

  async onUserAvatarSelected(file: File): Promise<void> {
    await this.userStore.uploadAvatar.mutate({ avatar: file });
    if (this.userStore.uploadAvatar.error()) {
      this.#toastService.error("Échec de l'upload de l'avatar");
      return;
    }
    this.#toastService.success('Avatar mis à jour');
  }

  async onVisibilityToggle(isPublic: boolean): Promise<void> {
    const visibility = isPublic ? 'PUBLIC' : 'PRIVATE';
    const result = await this.userStore.updateProfile.mutate({ visibility });
    if (result) {
      this.#toastService.success(`Profil ${isPublic ? 'public' : 'privé'}`);
    } else if (this.userStore.updateProfile.error()) {
      this.#toastService.error('Échec de la mise à jour');
      const user = this.currentUser();
      if (user) {
        this.visibilitySwitch.setValue(user.visibility === 'PUBLIC', { emitEvent: false });
      }
    }
  }

  async onShareEvaluationsToggle(sharePublicly: boolean): Promise<void> {
    const result = await this.userStore.updateProfile.mutate({ shareEvaluationsPublicly: sharePublicly });
    if (result) {
      this.#toastService.success(sharePublicly ? 'Évaluations publiques' : 'Évaluations privées');
    } else if (this.userStore.updateProfile.error()) {
      this.#toastService.error('Échec de la mise à jour');
      const user = this.currentUser();
      if (user) {
        this.shareEvaluationsSwitch.setValue(user.shareEvaluationsPublicly ?? true, { emitEvent: false });
      }
    }
  }

  onCancelUserChanges(): void {
    const original = this.#userOriginalFormValue();
    if (original) {
      this.profileForm.patchValue(original);
      this.profileForm.markAsPristine();
      this.profileForm.markAsUntouched();
      this.#userCurrentFormValue.set(original);
    }
  }

  async onUpdateProfile(): Promise<void> {
    this.#formService.triggerValidation(this.profileForm);
    this.inputs().forEach((input) => input.forceShowError());

    if (this.profileForm.invalid || this.profileForm.pending) return;

    this.userStore.updateProfile.reset();
    const { displayName, username, bio } = this.profileForm.getRawValue();

    const result = await this.userStore.updateProfile.mutate({
      displayName,
      username,
      bio: bio ?? undefined,
    });

    if (result) {
      this.#toastService.success('Profil mis à jour');
      const savedValue = this.profileForm.getRawValue();
      this.#userOriginalFormValue.set(savedValue);
      this.#userCurrentFormValue.set(savedValue);
      this.profileForm.markAsPristine();
    }
  }

  onLogout(): void {
    this.showLogoutConfirm.set(true);
  }

  onConfirmLogout(): void {
    this.showLogoutConfirm.set(false);
    this.#logoutLoading.set(true);
    this.#authService.signOut().pipe(take(1)).subscribe();
  }

  async copyProfileLink(): Promise<void> {
    const url = this.profileUrl();
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      this.#toastService.success('Lien copié');
    } catch {
      this.#toastService.error('Impossible de copier le lien');
    }
  }

  // ===== CLUB METHODS =====

  patchClubFormWithData(club: ClubResponseDto): void {
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
    const rawValue = this.clubForm.getRawValue();
    this.#clubOriginalFormValue.set(rawValue);
    this.#clubCurrentFormValue.set(rawValue);
  }

  async onClubAvatarSelected(file: File): Promise<void> {
    const clubData = this.club();
    if (!clubData) {
      this.#toastService.error('Club introuvable');
      return;
    }
    await this.clubStore.uploadClubAvatar.mutate({ clubId: clubData.id, avatar: file });
    if (this.clubStore.uploadClubAvatar.error()) {
      this.#toastService.error("Échec de l'upload");
      return;
    }
    this.#toastService.success('Avatar du club mis à jour');
  }

  onCancelClubChanges(): void {
    const original = this.#clubOriginalFormValue();
    if (original) {
      this.clubForm.patchValue(original);
      this.clubForm.markAsPristine();
      this.clubForm.markAsUntouched();
      this.#clubCurrentFormValue.set(original);
    }
  }

  async onUpdateClub(): Promise<void> {
    this.#formService.triggerValidation(this.clubForm);
    this.inputs().forEach((input) => input.forceShowError());
    this.selects().forEach((select) => select.forceShowError());

    if (this.clubForm.invalid) return;

    const clubData = this.club();
    if (!clubData) return;

    const formValue = this.clubForm.getRawValue();
    const updateDto: UpdateClubDto = {
      ...formValue,
      description: formValue.description || undefined,
      maxMembers: formValue.maxMembers || undefined,
    };

    await this.clubStore.updateClub.mutate({ id: clubData.id, data: updateDto });

    if (this.clubStore.updateClub.error()) {
      this.#toastService.error('Impossible de mettre à jour le club');
      return;
    }

    this.#toastService.success('Paramètres du club mis à jour');
    const savedValue = this.clubForm.getRawValue();
    this.#clubOriginalFormValue.set(savedValue);
    this.#clubCurrentFormValue.set(savedValue);
    this.clubForm.markAsPristine();

    const updatedClubData = this.club();
    if (updatedClubData) {
      this.contextStore.updateCurrentClub(updatedClubData);
    }
  }

  onArchiveClub(): void {
    this.showArchiveConfirm.set(true);
  }

  async onConfirmArchiveClub(): Promise<void> {
    this.showArchiveConfirm.set(false);
    // TODO: Implement archive endpoint
    this.#toastService.success('Club archivé');
    this.contextStore.switchToSolo();
    this.close.emit();
    await this.#router.navigate(['/']);
  }

  onLeaveClub(): void {
    this.showLeaveConfirm.set(true);
  }

  async onConfirmLeaveClub(): Promise<void> {
    if (this.clubStore.removeMember.loading()) return;

    const clubData = this.club();
    const currentUser = this.#authService.currentUser();
    if (!clubData || !currentUser) return;

    this.showLeaveConfirm.set(false);

    await this.clubStore.removeMember.mutate({ clubId: clubData.id, userId: currentUser.id });

    if (this.clubStore.removeMember.error()) {
      this.#toastService.error('Impossible de quitter le club');
      return;
    }

    this.#toastService.success(`Vous avez quitté ${clubData.name}`);
    await this.contextStore.loadUserClubs();
    this.contextStore.switchToSolo();
    this.close.emit();
    void this.#router.navigate(['/']);
  }

  async copyClubLink(): Promise<void> {
    const url = this.clubUrl();
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      this.#toastService.success('Lien copié');
    } catch {
      this.#toastService.error('Impossible de copier le lien');
    }
  }
}