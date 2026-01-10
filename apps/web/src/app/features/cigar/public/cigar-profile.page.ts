import { Component, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import {
  IconDirective,
  ButtonComponent,
  TooltipDirective,
  SkeletonComponent,
  RatingBandsComponent,
  TastingsGridComponent,
} from '@cigar-platform/shared/ui';
import { injectCigarStore } from '../../../core/stores/cigar.store';
import { injectTastingStore } from '../../../core/stores/tasting.store';

/**
 * Cigar Public Profile Page
 *
 * Route: /cigar/:slug (Prestige URL with slug)
 * Accessible: Public
 *
 * Features:
 * - View cigar information (name, brand, specs, description)
 * - Community rating from public tastings
 * - List of public tastings for this cigar
 *
 * Architecture: ALL STARS ⭐
 * - Reactive getter pattern for queries
 * - Computed signals (no `!` assertions)
 * - Clean separation of concerns
 * - Uses slug from URL
 */
@Component({
  selector: 'app-cigar-profile',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    IconDirective,
    ButtonComponent,
    TooltipDirective,
    SkeletonComponent,
    RatingBandsComponent,
    TastingsGridComponent,
  ],
  templateUrl: './cigar-profile.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CigarProfilePage {
  #route = inject(ActivatedRoute);
  #router = inject(Router);
  #cigarStore = injectCigarStore();
  #tastingStore = injectTastingStore();

  // Route params (toSignal pattern - no subscribe)
  readonly cigarSlugParam = toSignal(
    this.#route.paramMap.pipe(map((p) => p.get('slug') ?? '')),
    { initialValue: '' }
  );

  // Query cigar by slug (ALL STARS ⭐ - Reactive getter pattern)
  readonly cigarQuery = this.#cigarStore.getCigarBySlug(() => this.cigarSlugParam());

  // Query state signals
  readonly loading = this.cigarQuery.loading;
  readonly error = this.cigarQuery.error;

  // Cigar data with fallback
  readonly cigar = computed(() => this.cigarQuery.data() ?? null);

  // Computed values (with safe fallbacks)
  readonly name = computed(() => this.cigar()?.name ?? '');
  readonly slug = computed(() => this.cigar()?.slug ?? '');
  readonly isVerified = computed(() => this.cigar()?.isVerified ?? false);

  // Technical specifications
  readonly vitola = computed(() => this.cigar()?.vitola ?? null);
  readonly length = computed(() => this.cigar()?.length ?? null);
  readonly ringGauge = computed(() => this.cigar()?.ringGauge ?? null);
  readonly wrapper = computed(() => this.cigar()?.wrapper ?? null);
  readonly origin = computed(() => this.cigar()?.origin ?? null);
  readonly strength = computed(() => this.cigar()?.strength ?? null);
  readonly description = computed(() => this.cigar()?.description ?? null);

  // Dimensions formatted (ex: "130mm x 52")
  readonly dimensions = computed(() => {
    const l = this.length();
    const rg = this.ringGauge();
    if (!l && !rg) return null;
    if (l && rg) return `${l}mm × ${rg}`;
    if (l) return `${l}mm`;
    return `Ø ${rg}`;
  });

  // Brand data (nested in cigar response)
  readonly brand = computed(() => this.cigar()?.brand ?? null);
  readonly brandName = computed(() => this.brand()?.name ?? '');
  readonly brandSlug = computed(() => this.brand()?.slug ?? '');
  readonly brandCountry = computed(() => this.brand()?.country ?? '');
  readonly brandLogoUrl = computed(() => this.brand()?.logoUrl ?? null);

  // Community stats (from API)
  readonly stats = computed(() => this.cigar()?.stats ?? null);
  readonly averageRating = computed(() => this.stats()?.averageRating ?? 0);
  readonly tastingCount = computed(() => this.stats()?.tastingCount ?? 0);

  // Query tastings by cigar ID
  readonly tastingsQuery = this.#tastingStore.getTastingsByCigar(
    () => this.cigar()?.id ?? ''
  );
  readonly tastingsLoading = this.tastingsQuery.loading;
  readonly tastings = computed(() => this.tastingsQuery.data() ?? []);

  // Template compatibility
  readonly country = this.brandCountry;
  readonly format = this.vitola;

  /**
   * Navigate to tasting page with pre-selected cigar
   */
  startTasting(): void {
    const cigar = this.cigar();
    if (!cigar?.id) return;

    void this.#router.navigate(['/tasting', 'new'], {
      queryParams: { cigarId: cigar.id },
    });
  }
}
