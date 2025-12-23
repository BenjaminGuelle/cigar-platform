import { Component, inject, signal, computed, WritableSignal, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
  FormGroup,
  FormControl,
} from '@angular/forms';
import { Router } from '@angular/router';
import { tap, catchError, take, finalize } from 'rxjs/operators';
import { EMPTY, from } from 'rxjs';
import { LayoutComponent } from '../../core';
import { AuthService, FormService } from '../../core/services';
import { AuthenticationService } from '@cigar-platform/types/lib/authentication/authentication.service';
import { UsersService } from '@cigar-platform/types/lib/users/users.service';
import { ButtonComponent, InputComponent, AvatarComponent } from '@cigar-platform/shared/ui';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    LayoutComponent,
    ButtonComponent,
    InputComponent,
    AvatarComponent,
  ],
  templateUrl: './settings.component.html',
})
export class SettingsComponent {
  #authService = inject(AuthService);
  #authenticationService = inject(AuthenticationService);
  #usersService = inject(UsersService);
  #formService = inject(FormService);
  #fb = inject(FormBuilder);
  #router = inject(Router);

  readonly currentUser = this.#authService.currentUser;

  #profileUpdateLoading: WritableSignal<boolean> = signal<boolean>(false);
  #avatarUploadLoading: WritableSignal<boolean> = signal<boolean>(false);
  #logoutLoading: WritableSignal<boolean> = signal<boolean>(false);
  #errorSignal: WritableSignal<string | null> = signal<string | null>(null);
  #successSignal: WritableSignal<string | null> = signal<string | null>(null);
  #selectedAvatarPreview: WritableSignal<string | null> = signal<string | null>(null);

  readonly profileUpdateLoading = this.#profileUpdateLoading.asReadonly();
  readonly avatarUploadLoading = this.#avatarUploadLoading.asReadonly();
  readonly logoutLoading = this.#logoutLoading.asReadonly();
  readonly error = this.#errorSignal.asReadonly();
  readonly success = this.#successSignal.asReadonly();
  readonly selectedAvatarPreview = this.#selectedAvatarPreview.asReadonly();

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

  profileForm: FormGroup<{
    displayName: FormControl<string>;
  }> = this.#fb.nonNullable.group({
    displayName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
  });

  #selectedAvatarFile: File | null = null;

  constructor() {
    // Initialize form with current user data
    const user = this.currentUser();
    if (user) {
      this.profileForm.patchValue({
        displayName: user.displayName,
      });
    }
  }

  onAvatarFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      this.#errorSignal.set('Type de fichier invalide. Seuls JPEG, PNG et WebP sont autorisés.');
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      this.#errorSignal.set('Fichier trop volumineux. Taille maximale : 5MB.');
      return;
    }

    this.#selectedAvatarFile = file;

    // Generate preview
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      this.#selectedAvatarPreview.set(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Auto-upload
    this.uploadAvatar();
  }

  uploadAvatar(): void {
    if (!this.#selectedAvatarFile) {
      this.#errorSignal.set('Aucun fichier sélectionné');
      return;
    }

    this.#avatarUploadLoading.set(true);
    this.#errorSignal.set(null);
    this.#successSignal.set(null);

    from(this.#usersService.usersControllerUploadAvatar({ avatar: this.#selectedAvatarFile })).pipe(
      take(1),
      tap((result) => {
        this.#successSignal.set('Avatar mis à jour avec succès');
        this.#selectedAvatarPreview.set(null);
        this.#selectedAvatarFile = null;
        // Reload user profile to get updated avatar
        this.#reloadUserProfile();
      }),
      catchError((err) => {
        this.#errorSignal.set(err.error?.error?.message || 'Échec de l\'upload de l\'avatar');
        console.error('Avatar upload error:', err);
        return EMPTY;
      }),
      finalize(() => this.#avatarUploadLoading.set(false))
    ).subscribe();
  }

  onUpdateProfile(): void {
    this.#formService.triggerValidation(this.profileForm);

    if (this.profileForm.invalid) {
      return;
    }

    this.#profileUpdateLoading.set(true);
    this.#errorSignal.set(null);
    this.#successSignal.set(null);

    const { displayName } = this.profileForm.getRawValue();

    from(this.#authenticationService.authControllerUpdateProfile({ displayName })).pipe(
      take(1),
      tap((user) => {
        this.#successSignal.set('Profil mis à jour avec succès');
        this.#reloadUserProfile();
      }),
      catchError((err) => {
        this.#errorSignal.set(err.error?.error?.message || 'Échec de la mise à jour du profil');
        console.error('Profile update error:', err);
        return EMPTY;
      }),
      finalize(() => this.#profileUpdateLoading.set(false))
    ).subscribe();
  }

  onLogout(): void {
    if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
      this.#logoutLoading.set(true);
      this.#authService.signOut().pipe(take(1)).subscribe();
    }
  }

  #reloadUserProfile(): void {
    from(this.#authenticationService.authControllerGetProfile()).pipe(
      take(1),
      catchError((err) => {
        console.error('Failed to reload profile:', err);
        return EMPTY;
      })
    ).subscribe();
  }
}