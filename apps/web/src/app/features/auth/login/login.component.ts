import { Component, inject, signal, WritableSignal } from '@angular/core';
import { Router } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  #authService = inject(AuthService);
  #router = inject(Router);
  #fb = inject(FormBuilder);

  #errorSignal: WritableSignal<string | null> = signal<string | null>(null);
  #loadingSignal: WritableSignal<boolean> = signal<boolean>(false);
  #googleLoadingSignal: WritableSignal<boolean> = signal<boolean>(false);

  readonly error = this.#errorSignal.asReadonly();
  readonly loading = this.#loadingSignal.asReadonly();
  readonly googleLoading = this.#googleLoadingSignal.asReadonly();

  loginForm: FormGroup = this.#fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.#loadingSignal.set(true);
    this.#errorSignal.set(null);

    const { email, password } = this.loginForm.value;

    this.#authService.signIn(email, password).subscribe({
      next: ({ error }) => {
        this.#loadingSignal.set(false);

        if (error) {
          this.#errorSignal.set(error.message || 'Invalid credentials');
          return;
        }

        this.#router.navigate(['/']);
      },
      error: (err) => {
        this.#loadingSignal.set(false);
        this.#errorSignal.set('An unexpected error occurred');
        console.error('Sign in error:', err);
      },
    });
  }

  onGoogleSignIn(): void {
    this.#googleLoadingSignal.set(true);
    this.#errorSignal.set(null);

    this.#authService.signInWithGoogle().subscribe({
      next: ({ error }) => {
        this.#googleLoadingSignal.set(false);

        if (error) {
          this.#errorSignal.set(error.message || 'Google sign-in failed');
        }
      },
      error: (err) => {
        this.#googleLoadingSignal.set(false);
        this.#errorSignal.set('Google sign-in failed');
        console.error('Google sign in error:', err);
      },
    });
  }

  navigateToSignup(): void {
    this.#router.navigate(['/auth/signup']);
  }

  get emailControl() {
    return this.loginForm.get('email');
  }

  get passwordControl() {
    return this.loginForm.get('password');
  }
}
