import { Component, inject, effect } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NgxSonnerToaster } from 'ngx-sonner';
import { LoadingService, AuthService } from './core/services';
import { PwaInstallPromptComponent } from './shared/components/pwa-install-prompt';

@Component({
  imports: [RouterModule, NgxSonnerToaster, PwaInstallPromptComponent],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
  standalone: true,
})
export class App {
  #loadingService = inject(LoadingService);
  #authService = inject(AuthService);

  protected title = 'Cigar & Club';

  constructor() {
    // Hide app loader once auth initialization is complete
    effect(() => {
      const authLoading = this.#authService.loading();
      if (!authLoading) {
        // Auth is ready, hide the app loader
        setTimeout(() => {
          this.#loadingService.hideAppLoader();
        }, 300); // Small delay for smooth transition
      }
    });
  }
}
