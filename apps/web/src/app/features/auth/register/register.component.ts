import { Component, inject, signal, WritableSignal } from '@angular/core';
import { Router } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  FormControl,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { tap, catchError, take } from 'rxjs/operators';
import { EMPTY } from 'rxjs';
import { AuthService } from '../../../core/services';
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
  #authService = inject(AuthService);
  #router = inject(Router);
  #fb = inject(FormBuilder);

  #errorSignal: WritableSignal<string | null> = signal<string | null>(null);
  #loadingSignal: WritableSignal<boolean> = signal<boolean>(false);
  #googleLoadingSignal: WritableSignal<boolean> = signal<boolean>(false);

  readonly error = this.#errorSignal.asReadonly();
  readonly loading = this.#loadingSignal.asReadonly();
  readonly googleLoading = this.#googleLoadingSignal.asReadonly();

  registerForm: FormGroup = this.#fb.group({
    displayName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]],
  });

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    const { displayName, email, password, confirmPassword } = this.registerForm.value;

    if (password !== confirmPassword) {
      this.#errorSignal.set('Les mots de passe ne correspondent pas');
      return;
    }

    this.#loadingSignal.set(true);
    this.#errorSignal.set(null);

    this.#authService.signUp(email, password, displayName).pipe(
      take(1),
      tap(() => this.#loadingSignal.set(false)),
      tap(({ error }) => {
        if (error) {
          this.#errorSignal.set(error.message || 'Erreur lors de l\'inscription');
        } else {
          this.#router.navigate(['/auth/login']);
        }
      }),
      catchError((err) => {
        this.#loadingSignal.set(false);
        this.#errorSignal.set('Une erreur inattendue s\'est produite');
        console.error('Sign up error:', err);
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

  navigateToLogin(): void {
    this.#router.navigate(['/auth/login']);
  }

  get displayNameControl() {
    return this.registerForm.get('displayName') as FormControl;
  }

  get emailControl() {
    return this.registerForm.get('email') as FormControl;
  }

  get passwordControl() {
    return this.registerForm.get('password') as FormControl;
  }

  get confirmPasswordControl() {
    return this.registerForm.get('confirmPassword') as FormControl;
  }
}
