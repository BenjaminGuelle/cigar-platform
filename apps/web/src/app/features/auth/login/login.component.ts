import { Component, inject, signal, WritableSignal } from '@angular/core';
import { Router } from '@angular/router';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormService } from '../../../core/services';
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

  readonly authStore: AuthStore = injectAuthStore();

  #errorSignal: WritableSignal<string | null> = signal<string | null>(null);

  readonly error = this.#errorSignal.asReadonly();

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

    this.#errorSignal.set(null);

    const { email, password } = this.loginForm.getRawValue();

    const result = await this.authStore.signIn.mutate({ email, password });

    if (result?.error) {
      this.#errorSignal.set(result.error.message || 'Votre Email ou Mot de passe est incorrect');
    }
    // Navigation is handled automatically by authStore.signIn.onSuccess
  }

  async onGoogleSignIn(): Promise<void> {
    this.#errorSignal.set(null);

    const result = await this.authStore.signInWithGoogle.mutate();

    if (result?.error) {
      this.#errorSignal.set(result.error.message || 'Échec de la connexion Google');
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
