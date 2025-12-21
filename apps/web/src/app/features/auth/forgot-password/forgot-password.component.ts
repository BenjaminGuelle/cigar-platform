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
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonComponent, InputComponent],
  templateUrl: './forgot-password.component.html',
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `],
})
export class ForgotPasswordComponent {
  #authService = inject(AuthService);
  #router = inject(Router);
  #fb = inject(FormBuilder);

  #errorSignal: WritableSignal<string | null> = signal<string | null>(null);
  #successSignal: WritableSignal<string | null> = signal<string | null>(null);
  #loadingSignal: WritableSignal<boolean> = signal<boolean>(false);

  readonly error = this.#errorSignal.asReadonly();
  readonly success = this.#successSignal.asReadonly();
  readonly loading = this.#loadingSignal.asReadonly();

  forgotPasswordForm: FormGroup = this.#fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  onSubmit(): void {
    if (this.forgotPasswordForm.invalid) {
      this.forgotPasswordForm.markAllAsTouched();
      return;
    }

    this.#loadingSignal.set(true);
    this.#errorSignal.set(null);
    this.#successSignal.set(null);

    const { email } = this.forgotPasswordForm.value;

    this.#authService.resetPassword(email).pipe(
      take(1),
      tap(() => this.#loadingSignal.set(false)),
      tap(({ error }) => {
        if (error) {
          this.#errorSignal.set(error.message || 'Erreur lors de l\'envoi du lien');
        } else {
          this.#successSignal.set('Un lien de réinitialisation a été envoyé à votre email');
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

  get emailControl() {
    return this.forgotPasswordForm.get('email') as FormControl;
  }
}
