import { Component, inject, signal, WritableSignal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService, FormService, ToastService } from '../../../core/services';
import { injectAuthStore, AuthStore } from '../../../core/stores';
import { ButtonComponent, InputComponent } from '@cigar-platform/shared/ui';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonComponent, InputComponent],
  templateUrl: './reset-password.component.html',
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `],
})
export class ResetPasswordComponent implements OnInit {
  #authService = inject(AuthService);
  #router = inject(Router);
  #fb = inject(FormBuilder);
  #formService = inject(FormService);
  #toastService = inject(ToastService);

  readonly authStore: AuthStore = injectAuthStore();

  #hasValidSessionSignal: WritableSignal<boolean> = signal<boolean>(true);

  readonly hasValidSession = this.#hasValidSessionSignal.asReadonly();

  // Typed reactive form (Angular 14+)
  resetPasswordForm = this.#fb.nonNullable.group({
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]],
  });

  ngOnInit(): void {
    // Check if user is authenticated (has valid session from email link)
    if (!this.#authService.session()) {
      this.#toastService.error('Lien de réinitialisation invalide ou expiré');
      this.#hasValidSessionSignal.set(false);
    }
  }

  async onSubmit(): Promise<void> {
    // Trigger validation and show errors
    this.#formService.triggerValidation(this.resetPasswordForm);

    if (this.resetPasswordForm.invalid) {
      return;
    }

    const { password, confirmPassword } = this.resetPasswordForm.getRawValue();

    if (password !== confirmPassword) {
      this.#toastService.error('Les mots de passe ne correspondent pas');
      return;
    }

    const result = await this.authStore.updatePassword.mutate({ password });

    if (result?.error) {
      this.#toastService.error(result.error.message || 'Erreur lors de la mise à jour du mot de passe');
    } else {
      this.#toastService.success('Mot de passe mis à jour avec succès. Redirection...');
      setTimeout(() => {
        this.#router.navigate(['/']);
      }, 2000);
    }
  }

  navigateToLogin(): void {
    this.#router.navigate(['/auth/login']);
  }
}
