import { Component, input, output, signal, computed, effect, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import {
  ModalComponent,
  ButtonComponent,
  InputComponent,
  SelectComponent,
  SliderComponent,
  ConfirmationComponent,
  AutocompleteComponent,
} from '@cigar-platform/shared/ui';
import { CIGAR_VITOLAS, CIGAR_STRENGTH_MIN, CIGAR_STRENGTH_MAX, CIGAR_STRENGTH_LABELS } from '@cigar-platform/types/lib/cigar';
import { CIGAR_COUNTRIES } from '@cigar-platform/types';
import { injectCigarStore } from '../../../core/stores/cigar.store';

/**
 * Create Cigar Modal Component
 *
 * Single-page form for creating a new cigar:
 * - Brand selection (input with + button to add new brand)
 * - Cigar details (name, vitola, strength slider)
 * - Success confirmation with actions
 *
 * Features:
 * - Bottom sheet on mobile, top-right on desktop
 * - Pre-fill with search query
 * - Brand input with toggle for new brand fields
 * - Strength slider (1-5, tactile)
 * - Success screen with "Déguster maintenant" or "Consulter la fiche"
 *
 * Architecture: ALL STARS ⭐
 * - Dumb component (receives data via inputs, emits events)
 * - Single unified form
 * - Reactive with signals
 */

type Step = 'form' | 'success';

@Component({
  selector: 'app-create-cigar-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ModalComponent,
    ButtonComponent,
    InputComponent,
    SelectComponent,
    SliderComponent,
    ConfirmationComponent,
    AutocompleteComponent,
  ],
  templateUrl: './create-cigar-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateCigarModalComponent {
  #fb = inject(FormBuilder);
  #router = inject(Router);
  #cigarStore = injectCigarStore();

  // Inputs
  readonly isOpen = input<boolean>(false);
  readonly prefillName = input<string>('');

  // Outputs
  readonly close = output<void>();

  // Brand search state (ALL STARS ⭐ - Reactive getter pattern)
  readonly brandSearchQuery = signal<string>('');
  readonly brandsQuery = this.#cigarStore.searchBrands(() => this.brandSearchQuery());
  readonly brandOptions = computed(() => {
    const brands = this.brandsQuery.data() ?? [];
    return brands.map(b => ({
      value: b.id,
      label: b.name,
      metadata: (typeof b.country === 'string' ? b.country : undefined),
      logoUrl: (typeof b.logoUrl === 'string' ? b.logoUrl : undefined),
    }));
  });
  readonly brandsLoading = this.brandsQuery.loading;

  // Country search state
  readonly countrySearchQuery = signal<string>('');

  // Country options for autocomplete (filtered + sorted by relevance)
  readonly countryOptions = computed(() => {
    const query = this.countrySearchQuery().toLowerCase().trim();

    if (!query) {
      // No search: return all countries
      return CIGAR_COUNTRIES.map(c => ({
        value: c.name,
        label: c.name,
        metadata: c.flag,
      }));
    }

    // Filter and sort by relevance
    return CIGAR_COUNTRIES
      .map(c => ({
        value: c.name,
        label: c.name,
        metadata: c.flag,
        // Calculate match score (higher = better)
        score:
          c.name.toLowerCase().startsWith(query) ? 100 : // "fr" → "France" = 100
          c.name.toLowerCase().includes(query) ? 50 :     // "rance" → "France" = 50
          0
      }))
      .filter(c => c.score > 0) // Only matching countries
      .sort((a, b) => b.score - a.score) // Best matches first
      .map(({ value, label, metadata }) => ({ value, label, metadata })); // Remove score
  });

  // Create mutation
  readonly createMutation = this.#cigarStore.createCigar;
  readonly creating = this.createMutation.loading;

  // Internal state
  readonly currentStep = signal<Step>('form');
  readonly showNewBrandFields = signal<boolean>(false);
  readonly createdCigarName = signal<string>('');
  readonly createdCigarSlug = signal<string>('');

  // Constants
  readonly VITOLAS = CIGAR_VITOLAS;
  readonly STRENGTH_LABELS = CIGAR_STRENGTH_LABELS;
  readonly COUNTRIES = CIGAR_COUNTRIES;

  // Single Form
  readonly cigarForm = this.#fb.group({
    brandName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    brandCountry: ['', [Validators.maxLength(50)]],
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    vitola: ['', [Validators.required]],
    strength: new FormControl<number>(3, [Validators.required, Validators.min(CIGAR_STRENGTH_MIN), Validators.max(CIGAR_STRENGTH_MAX)]),
  });


  constructor() {
    // Auto-fill cigar name when prefillName changes
    effect(() => {
      const prefill = this.prefillName();
      if (prefill && this.cigarForm.get('name')?.value === '') {
        this.cigarForm.patchValue({ name: prefill });
      }
    });

    // Reset everything when modal closes
    effect(() => {
      if (!this.isOpen()) {
        this.resetModal();
      }
    });
  }

  /**
   * Reset modal to initial state
   */
  resetModal(): void {
    this.currentStep.set('form');
    this.showNewBrandFields.set(false);
    this.cigarForm.reset({
      brandName: '',
      brandCountry: '',
      name: '',
      vitola: '',
      strength: 3,
    });
    this.createdCigarName.set('');
    this.createdCigarSlug.set('');
  }

  /**
   * Toggle new brand creation fields
   */
  toggleNewBrandFields(): void {
    this.showNewBrandFields.update(v => !v);
    // Clear country when hiding
    if (!this.showNewBrandFields()) {
      this.cigarForm.patchValue({ brandCountry: '' });
    }
  }

  /**
   * Handle brand search from autocomplete
   */
  onBrandSearch(query: string): void {
    this.brandSearchQuery.set(query);
  }

  /**
   * Handle "Create brand" action from autocomplete
   */
  onCreateBrand(brandName: string): void {
    this.cigarForm.patchValue({ brandName });
    this.showNewBrandFields.set(true);
  }

  /**
   * Handle country search from autocomplete
   */
  onCountrySearch(query: string): void {
    this.countrySearchQuery.set(query);
  }

  /**
   * Submit the full form (create cigar)
   */
  async onSubmit(): Promise<void> {
    if (this.cigarForm.invalid || this.creating()) return;

    const formValue = this.cigarForm.value;

    // Call mutation
    const result = await this.createMutation.mutate({
      name: formValue.name ?? '',
      brandName: formValue.brandName ?? '',
      brandCountry: this.showNewBrandFields() ? (formValue.brandCountry ?? undefined) : undefined,
      vitola: formValue.vitola ?? '',
      strength: formValue.strength ?? 3,
    });

    // Check for errors
    if (this.createMutation.error()) {
      // Error handling (TODO: show toast)
      return;
    }

    // Success - get created cigar from mutation result
    if (result) {
      this.createdCigarName.set(result.name);
      this.createdCigarSlug.set(result.slug);
    }

    // Show success screen
    this.currentStep.set('success');
  }

  /**
   * Handle "Déguster maintenant" action
   */
  handleStartTasting(): void {
    // TODO: Open tasting form Phase 1 with this cigar pre-selected
    this.close.emit();
  }

  /**
   * Handle "Consulter la fiche" action
   */
  handleViewCigar(): void {
    const slug = this.createdCigarSlug();
    if (slug) {
      void this.#router.navigate(['/cigar', slug]);
    }
    this.close.emit();
  }

  /**
   * Handle modal close
   */
  onClose(): void {
    this.close.emit();
  }
}
