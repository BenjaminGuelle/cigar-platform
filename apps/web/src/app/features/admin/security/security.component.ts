import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-security',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-8">
      <h1 class="text-3xl font-bold text-smoke-50 mb-6">Sécurité</h1>
      <p class="text-smoke-300">Logs et sécurité à venir...</p>
    </div>
  `,
})
export class SecurityComponent {}