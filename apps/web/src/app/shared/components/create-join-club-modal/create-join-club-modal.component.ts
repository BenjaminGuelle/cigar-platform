import { Component, input, output, signal, WritableSignal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { ModalComponent, InputComponent, ButtonComponent, IconDirective } from '@cigar-platform/shared/ui';
import { ClubsService } from '@cigar-platform/types/lib/clubs/clubs.service';
import type { ClubResponseDto } from '@cigar-platform/types';
import { ContextStore, type ClubWithRole } from '../../../core/stores/context.store';
import { injectClubStore } from '../../../core/stores/club.store';
import { FormService, ToastService } from '../../../core/services';
import clsx from 'clsx';

type ModalTab = 'create' | 'join';

/**
 * Create/Join Club Modal
 *
 * Modal with two tabs:
 * - Create: Form to create a new club
 * - Join: Form to join an existing club with invitation code
 *
 * ALL STARS Architecture ⭐
 * - Template in separate .html file
 * - Clean separation of concerns
 */
@Component({
  selector: 'app-create-join-club-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent, InputComponent, ButtonComponent, IconDirective],
  templateUrl: './create-join-club-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateJoinClubModalComponent {
  #clubsService = inject(ClubsService);
  #clubStore = injectClubStore();
  #contextStore = inject(ContextStore);
  #formService = inject(FormService);
  #toastService = inject(ToastService);
  #fb = inject(FormBuilder);

  readonly isOpen = input<boolean>(false);
  readonly close = output<void>();
  readonly clubCreated = output<void>();
  readonly clubJoined = output<void>();

  readonly activeTab: WritableSignal<ModalTab> = signal<ModalTab>('create');
  readonly clubType: WritableSignal<'private' | 'public'> = signal<'private' | 'public'>('private');
  readonly isJoining: WritableSignal<boolean> = signal<boolean>(false);

  // Use store mutation loading state for isCreating
  readonly isCreating = this.#clubStore.createClub.loading;

  // Create Club Form Group (typed)
  readonly createClubForm: FormGroup<{
    name: FormControl<string>;
    description: FormControl<string>;
    isPublicDirectory: FormControl<boolean>;
    autoApproveMembers: FormControl<boolean>;
    allowMemberInvites: FormControl<boolean>;
    maxMembers: FormControl<number | null>;
  }> = this.#fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    description: ['', [Validators.maxLength(500)]],
    isPublicDirectory: [true],
    autoApproveMembers: [false],
    allowMemberInvites: [true],
    maxMembers: this.#fb.control<number | null>(null),
  });

  // Join Club Form Group (typed)
  readonly joinClubForm: FormGroup<{
    invitationCode: FormControl<string>;
  }> = this.#fb.nonNullable.group({
    invitationCode: ['', [Validators.required]],
  });

  // Individual controls for template binding (compatibility)
  get nameControl() { return this.createClubForm.controls.name; }
  get descriptionControl() { return this.createClubForm.controls.description; }
  get invitationCodeControl() { return this.joinClubForm.controls.invitationCode; }

  setTab(tab: ModalTab): void {
    this.activeTab.set(tab);
  }

  setClubType(type: 'private' | 'public'): void {
    this.clubType.set(type);
  }

  getTabClasses(tab: ModalTab): string {
    const isActive = this.activeTab() === tab;
    return clsx(
      'flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200',
      isActive
        ? 'bg-gold-500 text-smoke-950'
        : 'bg-smoke-700 text-smoke-300 hover:bg-smoke-600 hover:text-smoke-100'
    );
  }

  getTypeButtonClasses(type: 'private' | 'public'): string {
    const isActive = this.clubType() === type;
    return clsx(
      'flex-1 flex items-center gap-3 p-4 rounded-lg border-2 transition-all duration-200',
      isActive
        ? 'border-gold-500 bg-gold-500/10 text-gold-500'
        : 'border-smoke-700 bg-smoke-800 text-smoke-300 hover:border-smoke-600 hover:bg-smoke-750'
    );
  }

  isCreateFormValid(): boolean {
    return this.createClubForm.valid;
  }

  async onCreateClub(): Promise<void> {
    this.#formService.triggerValidation(this.createClubForm);

    if (this.createClubForm.invalid) {
      return;
    }

    const { name, description, isPublicDirectory, autoApproveMembers, allowMemberInvites, maxMembers } =
      this.createClubForm.getRawValue();

    const visibility = (this.clubType() === 'public' ? 'PUBLIC' : 'PRIVATE') as 'PUBLIC' | 'PRIVATE';

    const createClubDto = {
      name,
      description: description || undefined,
      visibility,
      // Settings (only for PUBLIC clubs, but backend handles defaults)
      isPublicDirectory,
      autoApproveMembers,
      allowMemberInvites,
      maxMembers: maxMembers || undefined,
    };

    // Use store mutation (handles cache invalidation automatically)
    const club = await this.#clubStore.createClub.mutate(createClubDto);

    // Component handles UX only
    if (this.#clubStore.createClub.error()) {
      this.#toastService.error('Impossible de créer le club');
      return;
    }

    if (club?.id) {
      this.#toastService.success('Club créé avec succès !');

      // Reload user clubs to get fresh data (store already invalidated cache)
      await this.#contextStore.loadUserClubs();

      // Switch to new club context (user is owner)
      this.#contextStore.switchToClub(club, 'owner');

      this.clubCreated.emit();
      this.resetForms();
      this.close.emit();
    } else {
      this.#toastService.error('Impossible de créer le club');
    }
  }

  async onJoinClub(): Promise<void> {
    this.#formService.triggerValidation(this.joinClubForm);

    if (this.joinClubForm.invalid) {
      return;
    }

    this.isJoining.set(true);

    try {
      const { invitationCode } = this.joinClubForm.getRawValue();

      const data = await this.#clubsService.clubControllerJoinByCode({ code: invitationCode }) as { club?: ClubResponseDto; role?: string };

      if (data?.club) {
        const club = data.club;
        this.#toastService.success('Vous avez rejoint le club avec succès !');

        // Reload user clubs to get actual role
        await this.#contextStore.loadUserClubs();

        // Find the club we just joined with its role
        const joinedClub = this.#contextStore.userClubs().find((c) => c.id === club.id);
        const role = joinedClub?.myRole || 'member';

        // Switch to new club context with actual role
        this.#contextStore.switchToClub(club, role);

        this.clubJoined.emit();
        this.resetForms();
        this.close.emit();
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      this.#toastService.error('Code d\'invitation invalide ou club introuvable');
    } finally {
      this.isJoining.set(false);
    }
  }

  resetForms(): void {
    this.createClubForm.reset();
    this.joinClubForm.reset();
    this.clubType.set('private');
    this.activeTab.set('create');
  }
}
