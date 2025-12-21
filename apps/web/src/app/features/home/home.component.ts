import { Component, inject, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services';
import { UserModel } from '@cigar-platform/types';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
})
export class HomeComponent {
  #authService = inject(AuthService);

  readonly currentUser: Signal<UserModel | null> = this.#authService.currentUser;

  onSignOut(): void {
    this.#authService.signOut().subscribe();
  }
}