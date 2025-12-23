import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-config',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-8">
      <h1 class="text-3xl font-bold text-smoke-50 mb-6">Configuration</h1>
      <p class="text-smoke-300">Paramètres système à venir...</p>
    </div>
  `,
})
export class ConfigComponent {}