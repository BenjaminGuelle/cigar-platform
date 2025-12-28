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
  #router = inject(Router);
  #fb = inject(FormBuilder);
  #formService = inject(FormService);
  #toastService = inject(ToastService);

  readonly authStore: AuthStore = injectAuthStore();

  // Typed reactive form (Angular 14+)
  forgotPasswordForm = this.#fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  async onSubmit(): Promise<void> {
    // Trigger validation and show errors
    this.#formService.triggerValidation(this.forgotPasswordForm);

    if (this.forgotPasswordForm.invalid) {
      return;
    }

    const { email } = this.forgotPasswordForm.getRawValue();

    const result = await this.authStore.resetPassword.mutate({ email });

    if (result?.error) {
      this.#toastService.error(result.error.message || 'Erreur lors de l\'envoi du lien');
    } else {
      this.#toastService.success('Un lien de réinitialisation a été envoyé à votre email');
    }
  }

  navigateToLogin(): void {
    this.#router.navigate(['/auth/login']);
  }
}
