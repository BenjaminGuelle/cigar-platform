import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormService, ToastService } from '../../../core/services';
import { injectAuthStore, AuthStore } from '../../../core/stores';
import { ButtonComponent, InputComponent } from '@cigar-platform/shared/ui';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonComponent, InputComponent],
  templateUrl: './login.component.html',
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `],
})
export class LoginComponent {
  #router = inject(Router);
  #fb = inject(FormBuilder);
  #formService = inject(FormService);
  #toastService = inject(ToastService);

  readonly authStore: AuthStore = injectAuthStore();

  // Typed reactive form (Angular 14+)
  loginForm = this.#fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  async onSubmit(): Promise<void> {
    // Trigger validation and show errors
    this.#formService.triggerValidation(this.loginForm);

    if (this.loginForm.invalid) {
      return;
    }

    const { email, password } = this.loginForm.getRawValue();

    const result = await this.authStore.signIn.mutate({ email, password });

    if (result?.error) {
      this.#toastService.error(result.error.message || 'Votre Email ou Mot de passe est incorrect');
    }
    // Navigation is handled automatically by authStore.signIn.onSuccess
  }

  async onGoogleSignIn(): Promise<void> {
    const result = await this.authStore.signInWithGoogle.mutate();

    if (result?.error) {
      this.#toastService.error(result.error.message || 'Échec de la connexion Google');
    }
    // Note: Google OAuth will redirect, so we don't handle success here
  }

  navigateToRegister(): void {
    this.#router.navigate(['/auth/register']);
  }

  navigateToForgotPassword(): void {
    this.#router.navigate(['/auth/forgot-password']);
  }
}
