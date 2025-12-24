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
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonComponent, InputComponent],
  templateUrl: './register.component.html',
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `],
})
export class RegisterComponent {
  #router = inject(Router);
  #fb = inject(FormBuilder);
  #formService = inject(FormService);

  readonly authStore: AuthStore = injectAuthStore();

  #errorSignal: WritableSignal<string | null> = signal<string | null>(null);

  readonly error = this.#errorSignal.asReadonly();

  // Typed reactive form (Angular 14+)
  registerForm = this.#fb.nonNullable.group({
    displayName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]],
  });

  async onSubmit(): Promise<void> {
    // Trigger validation and show errors
    this.#formService.triggerValidation(this.registerForm);

    if (this.registerForm.invalid) {
      return;
    }

    const { displayName, email, password, confirmPassword } = this.registerForm.getRawValue();

    if (password !== confirmPassword) {
      this.#errorSignal.set('Les mots de passe ne correspondent pas');
      return;
    }

    this.#errorSignal.set(null);

    const result = await this.authStore.signUp.mutate({ email, password, displayName });

    if (result?.error) {
      this.#errorSignal.set(result.error.message || 'Erreur lors de l\'inscription');
    }
    // Navigation is handled automatically by authStore.signUp.onSuccess
  }

  async onGoogleSignIn(): Promise<void> {
    this.#errorSignal.set(null);

    const result = await this.authStore.signInWithGoogle.mutate();

    if (result?.error) {
      this.#errorSignal.set(result.error.message || 'Échec de la connexion Google');
    }
    // Note: Google OAuth will redirect, so we don't handle success here
  }

  navigateToLogin(): void {
    this.#router.navigate(['/auth/login']);
  }
}
