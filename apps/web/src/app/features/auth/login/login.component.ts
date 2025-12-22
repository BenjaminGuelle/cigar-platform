import { Component, inject, signal, WritableSignal } from '@angular/core';
import { Router } from '@angular/router';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { tap, catchError, take } from 'rxjs/operators';
import { EMPTY } from 'rxjs';
import { AuthService, FormService } from '../../../core/services';
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
  #authService = inject(AuthService);
  #router = inject(Router);
  #fb = inject(FormBuilder);
  #formService = inject(FormService);

  #errorSignal: WritableSignal<string | null> = signal<string | null>(null);
  #loadingSignal: WritableSignal<boolean> = signal<boolean>(false);
  #googleLoadingSignal: WritableSignal<boolean> = signal<boolean>(false);

  readonly error = this.#errorSignal.asReadonly();
  readonly loading = this.#loadingSignal.asReadonly();
  readonly googleLoading = this.#googleLoadingSignal.asReadonly();

  // Typed reactive form (Angular 14+)
  loginForm = this.#fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  onSubmit(): void {
    // Trigger validation and show errors
    this.#formService.triggerValidation(this.loginForm);

    if (this.loginForm.invalid) {
      return;
    }

    this.#loadingSignal.set(true);
    this.#errorSignal.set(null);

    const { email, password } = this.loginForm.getRawValue();

    this.#authService.signIn(email, password).pipe(
      take(1),
      tap(() => this.#loadingSignal.set(false)),
      tap(({ error }) => {
        if (error) {
          this.#errorSignal.set(error.message || 'Votre Email ou Mot de passe est incorrect');
        } else {
          this.#router.navigate(['/']);
        }
      }),
      catchError((err) => {
        this.#loadingSignal.set(false);
        this.#errorSignal.set('Une erreur inattendue s\'est produite');
        console.error('Sign in error:', err);
        return EMPTY;
      })
    ).subscribe();
  }

  onGoogleSignIn(): void {
    this.#googleLoadingSignal.set(true);
    this.#errorSignal.set(null);

    this.#authService.signInWithGoogle().pipe(
      take(1),
      tap(() => this.#googleLoadingSignal.set(false)),
      tap(({ error }) => {
        if (error) {
          this.#errorSignal.set(error.message || 'Échec de la connexion Google');
        }
      }),
      catchError((err) => {
        this.#googleLoadingSignal.set(false);
        this.#errorSignal.set('Échec de la connexion Google');
        console.error('Google sign in error:', err);
        return EMPTY;
      })
    ).subscribe();
  }

  navigateToRegister(): void {
    this.#router.navigate(['/auth/register']);
  }

  navigateToForgotPassword(): void {
    this.#router.navigate(['/auth/forgot-password']);
  }
}
