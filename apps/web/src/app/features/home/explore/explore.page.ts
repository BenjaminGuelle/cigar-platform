import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ClubsService } from '@cigar-platform/types/lib/clubs/clubs.service';
import type { ClubResponseDto } from '@cigar-platform/types';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import {
  PageHeaderComponent,
  PageSectionComponent,
  InputComponent,
  ButtonComponent,
  IconDirective,
} from '@cigar-platform/shared/ui';

/**
 * Explore Page - Global Discovery Layer
 *
 * MVP Scope: Clubs only
 * Future: Users, Cigars, Events
 *
 * Architecture:
 * - Extensible filter system (?filter=clubs|users|cigars|events)
 * - Tab-based UI ready for multi-entity discovery
 * - Single source of truth for discovery UX
 *
 * ALL STARS Architecture ⭐
 * - Template in separate .html file
 * - Styles in separate .scss file
 * - Clean separation of concerns
 */

type ExploreFilter = 'clubs' | 'users' | 'cigars' | 'events';

@Component({
  selector: 'app-explore',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    PageHeaderComponent,
    PageSectionComponent,
    InputComponent,
    ButtonComponent,
    IconDirective,
  ],
  templateUrl: './explore.page.html',
  styleUrls: ['./explore.page.css'],
})
export class ExplorePage {
  #clubsService = inject(ClubsService);
  #router = inject(Router);

  // State - Entity filter (MVP: clubs only)
  #entityFilter = signal<ExploreFilter>('clubs');
  readonly entityFilter = this.#entityFilter.asReadonly();

  // State - Clubs
  searchControl = new FormControl('');
  #allClubs = signal<ClubResponseDto[]>([]);
  #searchQuery = signal<string>('');
  loading = signal<boolean>(true);

  // Computed - Smart search (name, description, visibility)
  filteredClubs = computed(() => {
    const clubs = this.#allClubs();
    const query = this.#searchQuery().toLowerCase().trim();

    if (!query) {
      return clubs; // No filter, return all
    }

    return clubs.filter((club) => {
      const name = club.name.toLowerCase();
      const description = club.description ? String(club.description).toLowerCase() : '';
      const visibility = club.visibility.toLowerCase();

      // Smart search: name, description, or visibility keywords
      const matchesName = name.includes(query);
      const matchesDescription = description.includes(query);

      // Visibility keywords: "public", "privé", "prive", "private"
      const isPublicKeyword = ['public', 'publique'].some(kw => query.includes(kw));
      const isPrivateKeyword = ['privé', 'prive', 'private'].some(kw => query.includes(kw));

      const matchesVisibility =
        (isPublicKeyword && visibility === 'public') ||
        (isPrivateKeyword && visibility === 'private');

      return matchesName || matchesDescription || matchesVisibility;
    });
  });

  constructor() {
    // Setup search with debounce
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((value) => {
        this.#searchQuery.set(value || '');
      });

    // Load initial data based on entity filter
    this.loadData();
  }

  /**
   * Set entity filter (clubs, users, cigars, events)
   * MVP: Only clubs supported
   */
  setEntityFilter(filter: ExploreFilter): void {
    this.#entityFilter.set(filter);
    this.loadData();
  }

  /**
   * Load data based on current entity filter
   * MVP: Only clubs
   * Future: users, cigars, events
   */
  async loadData(): Promise<void> {
    const entity = this.#entityFilter();

    switch (entity) {
      case 'clubs':
        await this.loadClubs();
        break;
      case 'users':
        // TODO: Implement when users discovery is ready
        console.log('[ExplorePage] Users discovery not yet implemented');
        break;
      case 'cigars':
        // TODO: Implement when cigars discovery is ready
        console.log('[ExplorePage] Cigars discovery not yet implemented');
        break;
      case 'events':
        // TODO: Implement when events discovery is ready
        console.log('[ExplorePage] Events discovery not yet implemented');
        break;
    }
  }

  /**
   * Load clubs (MVP implementation)
   */
  async loadClubs(): Promise<void> {
    this.loading.set(true);
    try {
      const response: any = await this.#clubsService.clubControllerFindAll({
        limit: 100,
      });

      if (response?.data) {
        this.#allClubs.set(response.data);
      }
    } catch (error) {
      console.error('[ExplorePage] Failed to load clubs:', error);
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Navigate to club public profile
   */
  navigateToClub(clubId: string): void {
    this.#router.navigate(['/club', clubId]);
  }

  /**
   * Join/Request access to club
   */
  joinClub(event: Event, clubId: string): void {
    event.stopPropagation(); // Prevent navigation to club profile
    // TODO: Open join/request modal
    console.log('[ExplorePage] Join club:', clubId);
  }

  /**
   * Get member count (handles missing property in type)
   */
  getMemberCount(club: ClubResponseDto): number {
    return (club as any).memberCount || 0;
  }
}
