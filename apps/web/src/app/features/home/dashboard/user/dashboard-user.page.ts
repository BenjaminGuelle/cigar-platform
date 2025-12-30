import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * User Dashboard Page
 * Personal dashboard for solo context
 *
 * Shows:
 * - Welcome message
 * - Quick stats (evaluations, clubs, etc.)
 */
@Component({
  selector: 'app-dashboard-user',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="mx-auto max-w-5xl">
      <div class="rounded-xl border border-smoke-700 bg-smoke-800 p-8 text-center shadow-xl shadow-smoke-950/50 md:p-12">
        <h2 class="mb-4 text-2xl font-bold text-smoke-50 md:text-4xl">Bienvenue sur Cigar & Club</h2>
        <p class="text-lg text-smoke-300 md:text-xl">Votre application de gestion de club de cigares</p>
      </div>
    </div>
  `,
})
export class DashboardUserPage {}
