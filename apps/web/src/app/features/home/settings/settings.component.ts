import { Component, inject, signal, computed, WritableSignal, Signal, effect } from '@angular/core';
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
import { AuthService, FormService } from '../../../core/services';
import { injectUserStore, UserStore } from '../../../core/stores';
import { injectMutation, Mutation } from '../../../core/query';
import { UsersService } from '@cigar-platform/types/lib/users/users.service';
import { ButtonComponent, InputComponent, AvatarComponent } from '@cigar-platform/shared/ui';
import { UserDto } from '@cigar-platform/types';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonComponent,
    InputComponent,
    AvatarComponent,
  ],
  templateUrl: './settings.component.html',
})
export class SettingsComponent {
  #authService = inject(AuthService);
  #usersService = inject(UsersService);
  #formService = inject(FormService);
  #fb = inject(FormBuilder);
  #router = inject(Router);

  readonly userStore: UserStore = injectUserStore();
  readonly currentUser: Signal<UserDto | null> = this.userStore.currentUser.data;

  // Avatar upload state
  #avatarMessage: WritableSignal<{ type: 'success' | 'error'; text: string } | null> = signal(null);
  #selectedAvatarPreview: WritableSignal<string | null> = signal<string | null>(null);

  readonly avatarMessage = this.#avatarMessage.asReadonly();
  readonly selectedAvatarPreview = this.#selectedAvatarPreview.asReadonly();

  // Avatar upload mutation
  readonly uploadAvatarMutation: Mutation<unknown, { avatar: File }> = injectMutation({
    mutationFn: (variables: { avatar: File }) =>
      this.#usersService.usersControllerUploadAvatar(variables),
    onSuccess: () => {
      this.#avatarMessage.set({ type: 'success', text: 'Avatar mis à jour avec succès' });
      this.#selectedAvatarPreview.set(null);
      this.#selectedAvatarFile = null;
      // Refetch user to get updated avatar
      this.userStore.currentUser.refetch();
    },
    onError: (error: Error) => {
      this.#avatarMessage.set({
        type: 'error',
        text: (error as any).error?.error?.message || 'Échec de l\'upload de l\'avatar',
      });
    },
  });

  #logoutLoading: WritableSignal<boolean> = signal<boolean>(false);
  readonly logoutLoading = this.#logoutLoading.asReadonly();

  #profileSuccess: WritableSignal<string | null> = signal<string | null>(null);
  readonly profileSuccess = this.#profileSuccess.asReadonly();

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
    effect(() => {
      const user: UserDto | null = this.currentUser();
      if (user) {
        this.profileForm.patchValue({
          displayName: user.displayName,
        });
      }
    });
  }

  onAvatarFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      this.#avatarMessage.set({
        type: 'error',
        text: 'Type de fichier invalide. Seuls JPEG, PNG et WebP sont autorisés.',
      });
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      this.#avatarMessage.set({
        type: 'error',
        text: 'Fichier trop volumineux. Taille maximale : 5MB.',
      });
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
      this.#avatarMessage.set({ type: 'error', text: 'Aucun fichier sélectionné' });
      return;
    }

    this.#avatarMessage.set(null);

    // Use mutation instead of manual subscribe
    await this.uploadAvatarMutation.mutate({ avatar: this.#selectedAvatarFile });
  }

  async onUpdateProfile(): Promise<void> {
    this.#formService.triggerValidation(this.profileForm);

    if (this.profileForm.invalid) {
      return;
    }

    this.#profileSuccess.set(null);
    this.userStore.updateProfile.reset();

    const { displayName } = this.profileForm.getRawValue();

    const result: UserDto | null = await this.userStore.updateProfile.mutate({ displayName });

    if (result) {
      this.#profileSuccess.set('Profil mis à jour avec succès');
    }
  }

  onLogout(): void {
    if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
      this.#logoutLoading.set(true);
      this.#authService.signOut().pipe(take(1)).subscribe();
    }
  }
}