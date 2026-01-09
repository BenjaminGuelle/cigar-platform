import { Component, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import {
  IconDirective,
  PageSectionComponent,
  ButtonComponent,
  TooltipDirective,
  SkeletonComponent,
} from '@cigar-platform/shared/ui';
import { injectCigarStore } from '../../../core/stores/cigar.store';

/**
 * Cigar Public Profile Page
 *
 * Route: /cigar/:slug (Prestige URL with slug)
 * Accessible: Public
 *
 * Features:
 * - View cigar information (name, brand, format, strength, origin)
 * - See cigar image and description
 * - View ratings and reviews (TODO Phase 2)
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
    IconDirective,
    PageSectionComponent,
    ButtonComponent,
    TooltipDirective,
    SkeletonComponent,
  ],
  templateUrl: './cigar-profile.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CigarProfilePage {
  #route = inject(ActivatedRoute);
  #router = inject(Router);
  #cigarStore = injectCigarStore();

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
  readonly vitola = computed(() => this.cigar()?.vitola ?? '');
  readonly strength = computed(() => this.cigar()?.strength ?? 3);
  readonly isVerified = computed(() => this.cigar()?.isVerified ?? false);
  readonly status = computed(() => this.cigar()?.status ?? 'PENDING');
  readonly createdAt = computed(() => this.cigar()?.createdAt ?? null);

  // Brand data (nested in cigar response)
  readonly brand = computed(() => this.cigar()?.brand ?? null);
  readonly brandName = computed(() => this.brand()?.name ?? '');
  readonly brandSlug = computed(() => this.brand()?.slug ?? '');
  readonly brandCountry = computed(() => this.brand()?.country ?? '');
  readonly brandLogoUrl = computed(() => this.brand()?.logoUrl ?? null);
  readonly brandIsVerified = computed(() => this.brand()?.isVerified ?? false);

  // Template compatibility (for existing HTML)
  readonly country = this.brandCountry; // Alias for template
  readonly format = this.vitola; // Alias for template

  // TODO Phase 2: Add to CigarResponseDto
  readonly imageUrl = computed(() => null as string | null);
  readonly description = computed(() => null as string | null);
  readonly dimensions = computed(() => null as string | null);
  readonly averageRating = computed(() => 0);
  readonly reviewCount = computed(() => 0);

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
