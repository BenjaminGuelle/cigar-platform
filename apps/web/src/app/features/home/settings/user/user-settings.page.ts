import { Component, inject, signal, computed, WritableSignal, Signal, effect, viewChildren } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
  FormGroup,
  FormControl,
} from '@angular/forms';
import { Router } from '@angular/router';
import { take } from 'rxjs/operators';
import { AuthService, FormService, ToastService } from '../../../../core/services';
import { injectUserStore, UserStore } from '../../../../core/stores';
import {
  ButtonComponent,
  InputComponent,
  AvatarComponent,
  PageHeaderComponent,
  PageSectionComponent,
} from '@cigar-platform/shared/ui';
import { UserDto } from '@cigar-platform/types';
import { ConfirmationModalComponent } from '../../../../shared/components/confirmation-modal/confirmation-modal.component';

/**
 * User Profile Form Value Interface
 */
interface UserProfileFormValue {
  displayName: string;
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
    ButtonComponent,
    InputComponent,
    AvatarComponent,
    PageHeaderComponent,
    PageSectionComponent,
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

  // ViewChildren for form components
  inputs = viewChildren(InputComponent);

  // Avatar upload state
  #selectedAvatarPreview: WritableSignal<string | null> = signal<string | null>(null);
  #originalFormValue = signal<UserProfileFormValue | null>(null);
  #currentFormValue = signal<UserProfileFormValue | null>(null);

  readonly selectedAvatarPreview = this.#selectedAvatarPreview.asReadonly();

  #logoutLoading: WritableSignal<boolean> = signal<boolean>(false);
  readonly logoutLoading = this.#logoutLoading.asReadonly();

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

  // Track if form has unsaved changes (reactive!)
  hasUnsavedChanges = computed<boolean>(() => {
    const original = this.#originalFormValue();
    const current = this.#currentFormValue();

    if (!original || !current) return false;

    return original.displayName !== current.displayName;
  });

  profileForm: FormGroup<{
    displayName: FormControl<string>;
  }> = this.#fb.nonNullable.group({
    displayName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
  });

  #selectedAvatarFile: File | null = null;

  constructor() {
    // Sync form with user data
    effect(() => {
      const user: UserDto | null = this.currentUser();
      if (user) {
        this.profileForm.patchValue({
          displayName: user.displayName,
        });
        const formValue = this.profileForm.getRawValue();
        this.#originalFormValue.set(formValue);
        this.#currentFormValue.set(formValue);
      }
    });

    // Track form changes reactively
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

  onAvatarFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      this.#toastService.error('Type de fichier invalide. Seuls JPEG, PNG et WebP sont autorisés.');
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      this.#toastService.error('Fichier trop volumineux. Taille maximale : 5MB.');
      return;
    }

    this.#selectedAvatarFile = file;

    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      this.#selectedAvatarPreview.set(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    this.uploadAvatar();
  }

  async uploadAvatar(): Promise<void> {
    if (!this.#selectedAvatarFile) {
      this.#toastService.error('Aucun fichier sélectionné');
      return;
    }

    // Store handles API + invalidation
    await this.userStore.uploadAvatar.mutate({ avatar: this.#selectedAvatarFile });

    // Component handles UX only
    if (this.userStore.uploadAvatar.error()) {
      this.#toastService.error('Échec de l\'upload de l\'avatar');
      return;
    }

    this.#toastService.success('Avatar mis à jour avec succès');
    this.#selectedAvatarPreview.set(null);
    this.#selectedAvatarFile = null;
  }

  async onUpdateProfile(): Promise<void> {
    this.#formService.triggerValidation(this.profileForm);

    // Force show errors on all UI components
    this.inputs().forEach((input) => input.forceShowError());

    if (this.profileForm.invalid) {
      return;
    }

    this.userStore.updateProfile.reset();

    const { displayName } = this.profileForm.getRawValue();

    const result: UserDto | null = await this.userStore.updateProfile.mutate({ displayName });

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
}
