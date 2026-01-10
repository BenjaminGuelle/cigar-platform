import {
  Component,
  input,
  output,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import type { SearchResultDto } from '@cigar-platform/types';
import {
  SearchResultGroupComponent,
  SearchResultItemComponent,
  SkeletonComponent,
} from '@cigar-platform/shared/ui';

/**
 * Search result click event
 */
export interface SearchResultClickEvent {
  id: string;
  type: 'brand' | 'cigar' | 'club' | 'user';
  name: string;
  subtitle?: string;
  avatarUrl?: string;
  iconBadge?: string;
}

/**
 * Explore Search Component
 *
 * Displays search interface and results:
 * - Search hints when query is empty
 * - Loading skeletons during search
 * - Grouped results (cigars, brands, clubs, users)
 * - Empty state with create cigar option
 *
 * Used in: ExplorePage (search mode)
 */
@Component({
  selector: 'app-explore-search',
  standalone: true,
  imports: [
    CommonModule,
    SearchResultGroupComponent,
    SearchResultItemComponent,
    SkeletonComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="animate-fade-in">
    <!-- Search Hints (shown when query is empty) -->
    @if (showHints()) {
      <div class="pt-2 space-y-3">
        <p class="text-sm text-smoke-500">
          <span class="text-gold-700 font-medium">@pseudo</span>
          <span class="text-smoke-500 mx-2">·</span>
          Rechercher un membre
        </p>
        <p class="text-sm text-smoke-500">
          <span class="text-gold-700 font-medium">#club</span>
          <span class="text-smoke-500 mx-2">·</span>
          Rechercher un club
        </p>
        <p class="text-sm text-smoke-500">
          <span class="text-smoke-400 font-medium">nom du cigare</span>
          <span class="text-smoke-500 mx-2">·</span>
          Rechercher un cigare ou une marque
        </p>
      </div>
    }

    <!-- Skeleton Loading State -->
    @if (loading()) {
      <div class="pt-2 space-y-4">
        <div>
          <ui-skeleton size="text-xs" class="mb-3" />
          <div class="space-y-2">
            @for (i of [1, 2, 3]; track i) {
              <div class="flex items-center gap-3 py-2">
                <ui-skeleton size="avatar-sm" />
                <div class="flex-1 space-y-1">
                  <ui-skeleton size="text-md" />
                  <ui-skeleton size="text-xs" />
                </div>
              </div>
            }
          </div>
        </div>
      </div>
    }

    <!-- Results (Grouped by Type) -->
    @if (!loading() && hasResults()) {
      <!-- Cigars Group -->
      @if ((results().cigars && results().cigars!.length > 0) || (results().searchType === 'global' && !hasExactCigarMatch())) {
        <ui-search-result-group title="CIGARES" icon="flame">
          @if (results().cigars && results().cigars!.length > 0) {
            @for (cigar of limitedCigars(); track cigar.id) {
              <ui-search-result-item
                [title]="cigar.name"
                [subtitle]="cigar.metadata ?? ''"
                [avatarUrl]="cigar.imageUrl"
                [entityType]="'cigar'"
                [iconBadge]="cigar.isVerified ? 'verified' : 'community'"
                (clicked)="onResultClick({ id: cigar.id, type: 'cigar', name: cigar.name, subtitle: cigar.metadata ?? '', avatarUrl: cigar.imageUrl ?? undefined })"
              />
            }

            @if (hasMoreCigars()) {
              <div
                class="px-4 py-2 text-xs text-gold-500 hover:text-gold-400 cursor-pointer font-medium border-t border-smoke-700/30 transition-colors"
                (click)="seeAll.emit('cigar')"
              >
                → Voir tous les cigares ({{ results().cigars!.length }})
              </div>
            }
          }

          @if (results().searchType === 'global' && !hasExactCigarMatch()) {
            <ui-search-result-item
              [title]="'+ Ajouter ' + results().query + ' à la base'"
              [subtitle]="'Créer un nouveau cigare'"
              [entityType]="'cigar'"
              (clicked)="createCigar.emit()"
            />
          }
        </ui-search-result-group>
      }

      <!-- Brands Group -->
      @if (results().brands && results().brands!.length > 0) {
        <ui-search-result-group title="MARQUES" icon="star">
          @for (brand of limitedBrands(); track brand.id) {
            <ui-search-result-item
              [title]="brand.name"
              [subtitle]="brand.metadata ?? brand.country"
              [avatarUrl]="brand.imageUrl"
              [entityType]="'brand'"
              (clicked)="onResultClick({ id: brand.id, type: 'brand', name: brand.name, subtitle: brand.metadata ?? brand.country, avatarUrl: brand.imageUrl ?? undefined })"
            />
          }

          @if (hasMoreBrands()) {
            <div
              class="px-4 py-2 text-xs text-gold-500 hover:text-gold-400 cursor-pointer font-medium border-t border-smoke-700/30 transition-colors"
              (click)="seeAll.emit('brand')"
            >
              → Voir toutes les marques ({{ results().brands!.length }})
            </div>
          }
        </ui-search-result-group>
      }

      <!-- Clubs Group -->
      @if (results().clubs && results().clubs!.length > 0) {
        <ui-search-result-group title="CLUBS" icon="home">
          @for (club of limitedClubs(); track club.id) {
            <ui-search-result-item
              [title]="club.name"
              [subtitle]="'#' + club.slug"
              [iconBadge]="club.visibility === 'PUBLIC' ? 'public' : 'private'"
              [avatarUrl]="club.imageUrl"
              [entityType]="'club'"
              (clicked)="onResultClick({ id: club.id, type: 'club', name: club.name, subtitle: '#' + club.slug, avatarUrl: club.imageUrl ?? undefined, iconBadge: club.visibility === 'PUBLIC' ? 'public' : 'private' })"
            />
          }

          @if (hasMoreClubs()) {
            <div
              class="px-4 py-2 text-xs text-gold-500 hover:text-gold-400 cursor-pointer font-medium border-t border-smoke-700/30 transition-colors"
              (click)="seeAll.emit('club')"
            >
              → Voir tous les clubs ({{ results().clubs!.length }})
            </div>
          }
        </ui-search-result-group>
      }

      <!-- Users Group -->
      @if (results().users && results().users!.length > 0) {
        <ui-search-result-group title="MEMBRES" icon="users">
          @for (user of limitedUsers(); track user.id) {
            <ui-search-result-item
              [title]="user.name"
              [subtitle]="'@' + user.username"
              [avatarUrl]="user.imageUrl"
              [entityType]="'user'"
              (clicked)="onResultClick({ id: user.id, type: 'user', name: user.name, subtitle: '@' + user.username, avatarUrl: user.imageUrl ?? undefined })"
            />
          }

          @if (hasMoreUsers()) {
            <div
              class="px-4 py-2 text-xs text-gold-500 hover:text-gold-400 cursor-pointer font-medium border-t border-smoke-700/30 transition-colors"
              (click)="seeAll.emit('user')"
            >
              → Voir tous les membres ({{ results().users!.length }})
            </div>
          }
        </ui-search-result-group>
      }
    }

    <!-- Empty State -->
    @if (showEmpty()) {
      <div class="py-3 text-center">
        <p class="text-sm text-smoke-400">Aucun résultat trouvé</p>
      </div>

      @if (results().query && results().query.trim().length >= 1) {
        <ui-search-result-group title="CIGARES" icon="flame">
          <ui-search-result-item
            [title]="'+ Ajouter ' + results().query.trim() + ' à la base'"
            [subtitle]="'Créer un nouveau cigare'"
            [entityType]="'cigar'"
            (clicked)="createCigar.emit()"
          />
        </ui-search-result-group>
      }
    }
    </div>
  `,
})
export class ExploreSearchComponent {
  /** Loading state */
  readonly loading = input.required<boolean>();

  /** Search results */
  readonly results = input.required<SearchResultDto>();

  /** Show search hints */
  readonly showHints = input.required<boolean>();

  /** Show empty state */
  readonly showEmpty = input.required<boolean>();

  /** Has any results */
  readonly hasResults = input.required<boolean>();

  /** Has exact cigar match (for hiding create option) */
  readonly hasExactCigarMatch = input.required<boolean>();

  /** Limited results (3 per group) */
  readonly limitedCigars = input.required<SearchResultDto['cigars']>();
  readonly limitedBrands = input.required<SearchResultDto['brands']>();
  readonly limitedClubs = input.required<SearchResultDto['clubs']>();
  readonly limitedUsers = input.required<SearchResultDto['users']>();

  /** Has more indicators */
  readonly hasMoreCigars = input.required<boolean>();
  readonly hasMoreBrands = input.required<boolean>();
  readonly hasMoreClubs = input.required<boolean>();
  readonly hasMoreUsers = input.required<boolean>();

  /** Emitted when a result is clicked */
  readonly resultClick = output<SearchResultClickEvent>();

  /** Emitted when create cigar is clicked */
  readonly createCigar = output<void>();

  /** Emitted when "see all" is clicked */
  readonly seeAll = output<'cigar' | 'brand' | 'club' | 'user'>();

  /**
   * Handle result click - emit event
   */
  onResultClick(event: SearchResultClickEvent): void {
    this.resultClick.emit(event);
  }
}