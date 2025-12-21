import { Component, inject, signal, WritableSignal, OnInit } from '@angular/core';
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

  #errorSignal: WritableSignal<string | null> = signal<string | null>(null);
  #successSignal: WritableSignal<string | null> = signal<string | null>(null);
  #loadingSignal: WritableSignal<boolean> = signal<boolean>(false);

  readonly error = this.#errorSignal.asReadonly();
  readonly success = this.#successSignal.asReadonly();
  readonly loading = this.#loadingSignal.asReadonly();

  resetPasswordForm: FormGroup = this.#fb.group({
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]],
  });

  ngOnInit(): void {
    // Check if user is authenticated (has valid session from email link)
    if (!this.#authService.session()) {
      this.#errorSignal.set('Lien de réinitialisation invalide ou expiré');
    }
  }

  onSubmit(): void {
    if (this.resetPasswordForm.invalid) {
      this.resetPasswordForm.markAllAsTouched();
      return;
    }

    const { password, confirmPassword } = this.resetPasswordForm.value;

    if (password !== confirmPassword) {
      this.#errorSignal.set('Les mots de passe ne correspondent pas');
      return;
    }

    this.#loadingSignal.set(true);
    this.#errorSignal.set(null);
    this.#successSignal.set(null);

    this.#authService.updatePassword(password).pipe(
      take(1),
      tap(() => this.#loadingSignal.set(false)),
      tap(({ error }) => {
        if (error) {
          this.#errorSignal.set(error.message || 'Erreur lors de la mise à jour du mot de passe');
        } else {
          this.#successSignal.set('Mot de passe mis à jour avec succès. Redirection...');
          setTimeout(() => {
            this.#router.navigate(['/']);
          }, 2000);
        }
      }),
      catchError((err) => {
        this.#loadingSignal.set(false);
        this.#errorSignal.set('Une erreur inattendue s\'est produite');
        console.error('Reset password error:', err);
        return EMPTY;
      })
    ).subscribe();
  }

  navigateToLogin(): void {
    this.#router.navigate(['/auth/login']);
  }

  get passwordControl() {
    return this.resetPasswordForm.get('password') as FormControl;
  }

  get confirmPasswordControl() {
    return this.resetPasswordForm.get('confirmPassword') as FormControl;
  }
}
