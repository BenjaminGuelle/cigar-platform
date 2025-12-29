import { Component, inject, signal, computed, WritableSignal, Signal, effect, viewChildren } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
  FormGroup,
  FormControl,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { take } from 'rxjs/operators';
import { AuthService, FormService, ToastService } from '../../../../core/services';
import { injectUserStore, UserStore } from '../../../../core/stores';
import {
  ButtonComponent,
  InputComponent,
  AvatarUploadComponent,
  PageHeaderComponent,
  PageSectionComponent,
  SwitchComponent,
  IconDirective,
} from '@cigar-platform/shared/ui';
import { UserDto } from '@cigar-platform/types';
import { ConfirmationModalComponent } from '../../../../shared/components/confirmation-modal/confirmation-modal.component';
import { usernameAvailabilityValidator } from '../../../../core/validators/username-availability.validator';

/**
 * User Profile Form Value Interface (text fields only - switches are standalone)
 */
interface UserProfileFormValue {
  displayName: string;
  username: string;
  bio: string | null;
}

/**
 * User Settings Page
 *
 * Route: /settings (when context = solo)
 * Accessible: Always (user's personal settings)
 *
 * Features:
 * - Update display name
 * - Upload avatar
 * - View account info (email, auth provider)
 * - Logout
 *
 * Architecture: ALL STARS ⭐
 * - Template in separate .html file
 * - Clean separation of concerns
 * - Loaded by SettingsContextPage when context = solo
 */
@Component({
  selector: 'app-user-settings',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    IconDirective,
    ButtonComponent,
    InputComponent,
    AvatarUploadComponent,
    PageHeaderComponent,
    PageSectionComponent,
    SwitchComponent,
    ConfirmationModalComponent,
  ],
  templateUrl: './user-settings.page.html',
})
export class UserSettingsPage {
  #authService = inject(AuthService);
  #formService = inject(FormService);
  #toastService = inject(ToastService);
  #fb = inject(FormBuilder);
  #router = inject(Router);

  readonly userStore: UserStore = injectUserStore();
  readonly currentUser: Signal<UserDto | null> = this.userStore.currentUser.data;

  // Profile link computed
  readonly username = computed(() => this.currentUser()?.username ?? '');

  // Username error messages
  readonly usernameErrorMessages = {
    pattern: () => 'Uniquement minuscules, chiffres, points (.) et underscores (_)',
    minlength: () => 'Minimum 3 caractères',
    maxlength: () => 'Maximum 30 caractères',
    usernameTaken: () => 'Ce nom d\'utilisateur est déjà pris',
  };
  readonly profileUrl = computed(() => {
    const user = this.currentUser();
    if (!user) return '';
    return `${window.location.origin}/user/${user.id}`;
  });

  // ViewChildren for form components
  inputs = viewChildren(InputComponent);

  // Form state (text fields only - switches are standalone)
  #originalFormValue = signal<UserProfileFormValue | null>(null);
  #currentFormValue = signal<UserProfileFormValue | null>(null);

  #logoutLoading: WritableSignal<boolean> = signal<boolean>(false);
  readonly logoutLoading = this.#logoutLoading.asReadonly();

  // Standalone switches with auto-save (not part of main form)
  readonly visibilitySwitch: FormControl<boolean> = this.#fb.nonNullable.control<boolean>(true);
  readonly shareEvaluationsSwitch: FormControl<boolean> = this.#fb.nonNullable.control<boolean>(true);

  // Switch loading states
  readonly #visibilityLoading = signal<boolean>(false);
  readonly #shareEvaluationsLoading = signal<boolean>(false);

  // Confirmation modals
  readonly showLogoutConfirm = signal<boolean>(false);

  readonly isOAuthUser: Signal<boolean> = computed<boolean>(() => {
    const provider = this.currentUser()?.authProvider;
    return provider === 'google' || provider === 'apple';
  });

  readonly providerLabel: Signal<string> = computed<string>(() => {
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

  // Track if form has unsaved changes (text fields only - switches auto-save)
  hasUnsavedChanges = computed<boolean>(() => {
    const original = this.#originalFormValue();
    const current = this.#currentFormValue();

    if (!original || !current) return false;

    return (
      original.displayName !== current.displayName ||
      original.username !== current.username ||
      original.bio !== current.bio
    );
  });

  // Profile form (text fields only - switches are standalone)
  profileForm: FormGroup<{
    displayName: FormControl<string>;
    username: FormControl<string>;
    bio: FormControl<string | null>;
  }> = this.#fb.nonNullable.group({
    displayName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(30), Validators.pattern(/^[a-z0-9._]{3,30}$/)]],
    bio: this.#fb.control<string | null>(null, [Validators.maxLength(500)]),
  });

  constructor() {
    // Add async validator to username control
    const userId = this.currentUser()?.id;
    this.profileForm.controls.username.setAsyncValidators([
      usernameAvailabilityValidator(userId, 500),
    ]);

    // Sync text form fields with user data
    effect(() => {
      const user: UserDto | null = this.currentUser();
      if (user) {
        this.profileForm.patchValue({
          displayName: user.displayName,
          username: user.username ?? '',
          bio: user.bio ?? null,
        }, { emitEvent: false });
        const formValue = this.profileForm.getRawValue();
        this.#originalFormValue.set(formValue);
        this.#currentFormValue.set(formValue);
      }
    });

    // Sync standalone switches with user data (no emitEvent to avoid triggering save on init)
    effect(() => {
      const user: UserDto | null = this.currentUser();
      if (user) {
        const visibility = user.visibility ?? 'PUBLIC';
        this.visibilitySwitch.setValue(visibility === 'PUBLIC', { emitEvent: false });
        this.shareEvaluationsSwitch.setValue(user.shareEvaluationsPublicly ?? true, { emitEvent: false });
      }
    });

    // Auto-save visibility switch on change
    effect((onCleanup) => {
      const subscription = this.visibilitySwitch.valueChanges.subscribe((isPublic) => {
        this.onVisibilityToggle(isPublic);
      });

      onCleanup(() => subscription.unsubscribe());
    });

    // Auto-save shareEvaluations switch on change
    effect((onCleanup) => {
      const subscription = this.shareEvaluationsSwitch.valueChanges.subscribe((sharePublicly) => {
        this.onShareEvaluationsToggle(sharePublicly);
      });

      onCleanup(() => subscription.unsubscribe());
    });

    // Track form changes reactively (text fields only)
    effect((onCleanup) => {
      const subscription = this.profileForm.valueChanges.subscribe(() => {
        this.#currentFormValue.set(this.profileForm.getRawValue());
      });

      onCleanup(() => subscription.unsubscribe());
    });
  }

  /**
   * Cancel pending changes and reset form to original values
   */
  onCancelChanges(): void {
    const original = this.#originalFormValue();
    if (original) {
      this.profileForm.patchValue(original);
      this.profileForm.markAsPristine();
      this.profileForm.markAsUntouched();
      // Update current value to match original (will be synced by valueChanges)
      this.#currentFormValue.set(original);
    }
  }

  /**
   * Handle avatar file selection
   * Uploads the selected file and shows success/error feedback
   */
  async onAvatarFileSelected(file: File): Promise<void> {
    // Store handles API + invalidation
    await this.userStore.uploadAvatar.mutate({ avatar: file });

    // Component handles UX feedback
    if (this.userStore.uploadAvatar.error()) {
      this.#toastService.error('Échec de l\'upload de l\'avatar');
      return;
    }

    this.#toastService.success('Avatar mis à jour avec succès');
  }

  /**
   * Auto-save visibility switch
   * Triggers immediate API call on toggle
   */
  async onVisibilityToggle(isPublic: boolean): Promise<void> {
    this.#visibilityLoading.set(true);

    const visibility = isPublic ? 'PUBLIC' : 'PRIVATE';
    const result: UserDto | null = await this.userStore.updateProfile.mutate({ visibility });

    this.#visibilityLoading.set(false);

    if (result) {
      this.#toastService.success(`Profil ${isPublic ? 'public' : 'privé'}`);
    } else if (this.userStore.updateProfile.error()) {
      this.#toastService.error('Échec de la mise à jour de la visibilité');
      // Revert switch on error
      const user = this.currentUser();
      if (user) {
        this.visibilitySwitch.setValue(user.visibility === 'PUBLIC', { emitEvent: false });
      }
    }
  }

  /**
   * Auto-save shareEvaluations switch
   * Triggers immediate API call on toggle
   */
  async onShareEvaluationsToggle(sharePublicly: boolean): Promise<void> {
    this.#shareEvaluationsLoading.set(true);

    const result: UserDto | null = await this.userStore.updateProfile.mutate({ shareEvaluationsPublicly: sharePublicly });

    this.#shareEvaluationsLoading.set(false);

    if (result) {
      this.#toastService.success(sharePublicly ? 'Évaluations partagées publiquement' : 'Évaluations privées');
    } else if (this.userStore.updateProfile.error()) {
      this.#toastService.error('Échec de la mise à jour du partage des évaluations');
      // Revert switch on error
      const user = this.currentUser();
      if (user) {
        this.shareEvaluationsSwitch.setValue(user.shareEvaluationsPublicly ?? true, { emitEvent: false });
      }
    }
  }

  /**
   * Update profile (text fields only - switches auto-save)
   */
  async onUpdateProfile(): Promise<void> {
    this.#formService.triggerValidation(this.profileForm);

    // Force show errors on all UI components
    this.inputs().forEach((input) => input.forceShowError());

    // Block submission if form has errors OR async validation is pending
    if (this.profileForm.invalid || this.profileForm.pending) {
      return;
    }

    this.userStore.updateProfile.reset();

    const { displayName, username, bio } = this.profileForm.getRawValue();

    const result: UserDto | null = await this.userStore.updateProfile.mutate({
      displayName,
      username,
      bio: bio ?? undefined,
    });

    if (result) {
      this.#toastService.success('Profil mis à jour avec succès');
      // Update both original and current values after successful save
      const savedValue = this.profileForm.getRawValue();
      this.#originalFormValue.set(savedValue);
      this.#currentFormValue.set(savedValue);
      this.profileForm.markAsPristine();
    }
  }

  /**
   * Logout user
   * Shows confirmation modal first
   */
  onLogout(): void {
    this.showLogoutConfirm.set(true);
  }

  /**
   * Confirm logout
   * Signs out the user
   */
  onConfirmLogout(): void {
    // Close modal
    this.showLogoutConfirm.set(false);

    this.#logoutLoading.set(true);
    this.#authService.signOut().pipe(take(1)).subscribe();
  }

  /**
   * Copy profile link to clipboard
   */
  async copyProfileLink(): Promise<void> {
    const url = this.profileUrl();
    if (!url) return;

    try {
      await navigator.clipboard.writeText(url);
      this.#toastService.success('Lien copié dans le presse-papier');
    } catch {
      this.#toastService.error('Impossible de copier le lien');
    }
  }
}
