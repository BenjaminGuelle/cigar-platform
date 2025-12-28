import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-8">
      <h1 class="text-3xl font-bold text-smoke-50 mb-6">Gestion des utilisateurs</h1>
      <p class="text-smoke-300">Liste et gestion des utilisateurs à venir...</p>
    </div>
  `,
})
export class UsersComponent {}