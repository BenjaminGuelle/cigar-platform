import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IconDirective } from '@cigar-platform/shared/ui';

interface AdminSection {
  title: string;
  description: string;
  route: string;
  icon: 'heart' | 'star' | 'users' | 'settings' | 'lock' | 'flame';
  color: string;
}

/**
 * Admin Dashboard Component
 * Main admin dashboard with navigation to all admin sections
 */
@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, IconDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="container-page content-section-lg">
      <div class="mb-8">
        <h1 class="text-2xl font-bold text-smoke-50 mb-2">Administration</h1>
        <p class="text-smoke-400">Gerez la plateforme Cigar & Club</p>
      </div>

      <!-- Navigation Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        @for (section of sections; track section.route) {
          <a
            [routerLink]="section.route"
            class="group bg-smoke-800 rounded-lg p-6 border border-smoke-700 hover:border-smoke-600 transition-all hover:bg-smoke-750"
          >
            <div class="flex items-start gap-4">
              <div
                class="w-12 h-12 rounded-lg flex items-center justify-center"
                [class]="section.color"
              >
                <i [name]="section.icon" class="w-6 h-6"></i>
              </div>
              <div class="flex-1">
                <h3 class="text-lg font-semibold text-smoke-50 group-hover:text-gold-500 transition-colors">
                  {{ section.title }}
                </h3>
                <p class="text-sm text-smoke-400 mt-1">
                  {{ section.description }}
                </p>
              </div>
            </div>
          </a>
        }
      </div>
    </div>
  `,
})
export class DashboardComponent {
  readonly sections: AdminSection[] = [
    {
      title: 'Feedbacks',
      description: 'Gerez les retours utilisateurs',
      route: '/admin/feedbacks',
      icon: 'heart',
      color: 'bg-gold-500/20 text-gold-500',
    },
    {
      title: 'Analytics',
      description: 'Statistiques et evenements',
      route: '/admin/analytics',
      icon: 'flame',
      color: 'bg-blue-500/20 text-blue-400',
    },
    {
      title: 'Utilisateurs',
      description: 'Gestion des comptes',
      route: '/admin/users',
      icon: 'users',
      color: 'bg-green-500/20 text-green-400',
    },
    {
      title: 'Configuration',
      description: 'Parametres globaux',
      route: '/admin/config',
      icon: 'settings',
      color: 'bg-purple-500/20 text-purple-400',
    },
    {
      title: 'Securite',
      description: 'Logs et acces',
      route: '/admin/security',
      icon: 'lock',
      color: 'bg-red-500/20 text-red-400',
    },
    {
      title: 'Stats globales',
      description: 'Metriques plateforme',
      route: '/admin/stats',
      icon: 'star',
      color: 'bg-orange-500/20 text-orange-400',
    },
  ];
}