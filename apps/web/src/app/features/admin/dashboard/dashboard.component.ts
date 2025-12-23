import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Admin Dashboard Component
 * Main admin dashboard with overview and quick actions
 */
@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-8">
      <h1 class="text-3xl font-bold text-smoke-50 mb-6">Tableau de bord Admin</h1>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div class="bg-smoke-700 rounded-lg p-6 border border-smoke-600">
          <h3 class="text-smoke-400 text-sm font-medium mb-2">Utilisateurs</h3>
          <p class="text-3xl font-bold text-smoke-50">0</p>
        </div>

        <div class="bg-smoke-700 rounded-lg p-6 border border-smoke-600">
          <h3 class="text-smoke-400 text-sm font-medium mb-2">Clubs</h3>
          <p class="text-3xl font-bold text-smoke-50">0</p>
        </div>

        <div class="bg-smoke-700 rounded-lg p-6 border border-smoke-600">
          <h3 class="text-smoke-400 text-sm font-medium mb-2">Événements</h3>
          <p class="text-3xl font-bold text-smoke-50">0</p>
        </div>

        <div class="bg-smoke-700 rounded-lg p-6 border border-smoke-600">
          <h3 class="text-smoke-400 text-sm font-medium mb-2">Dégustations</h3>
          <p class="text-3xl font-bold text-smoke-50">0</p>
        </div>
      </div>
    </div>
  `,
})
export class DashboardComponent {}