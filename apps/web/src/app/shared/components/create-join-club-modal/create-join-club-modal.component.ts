import { Component, input, output, signal, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { ModalComponent, InputComponent, ButtonComponent, IconDirective } from '@cigar-platform/shared/ui';
import clsx from 'clsx';

type ModalTab = 'create' | 'join';

/**
 * Create/Join Club Modal
 * Modal with two tabs:
 * - Create: Form to create a new club
 * - Join: Form to join an existing club with invitation code
 */
@Component({
  selector: 'app-create-join-club-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent, InputComponent, ButtonComponent, IconDirective],
  template: `
    <ui-modal
      [isOpen]="isOpen()"
      size="md"
      position="right"
      (close)="close.emit()"
    >
      <!-- Header -->
      <div class="mb-6">
        <h2 id="modal-title" class="text-2xl font-display text-smoke-50 mb-2">
          {{ activeTab() === 'create' ? 'Créer un club' : 'Rejoindre un club' }}
        </h2>
        <p class="text-sm text-smoke-400">
          {{ activeTab() === 'create'
            ? 'Créez votre propre club privé pour partager vos dégustations'
            : 'Rejoignez un club existant avec un code d\'invitation'
          }}
        </p>
      </div>

      <!-- Tabs -->
      <div class="flex gap-2 mb-6">
        <button
          type="button"
          (click)="setTab('create')"
          [class]="getTabClasses('create')"
        >
          Créer
        </button>
        <button
          type="button"
          (click)="setTab('join')"
          [class]="getTabClasses('join')"
        >
          Rejoindre
        </button>
      </div>

      <!-- Create Club Form -->
      @if (activeTab() === 'create') {
        <form (ngSubmit)="onCreateClub()" class="space-y-4">
          <ui-input
            inputId="club-name"
            type="text"
            label="Nom du club"
            placeholder="Ex: Les Aficionados de Paris"
            [control]="nameControl"
            [required]="true"
            [maxlength]="50"
            autocomplete="off"
          />

          <ui-input
            inputId="club-description"
            type="text"
            label="Description (optionnel)"
            placeholder="Ex: Club de passionnés de cigares cubains"
            [control]="descriptionControl"
            [maxlength]="200"
            autocomplete="off"
          />

          <!-- Type Selection -->
          <div class="space-y-2">
            <label class="block text-sm font-medium text-smoke-200">
              Type de club
            </label>
            <div class="flex gap-3">
              <button
                type="button"
                (click)="setClubType('private')"
                [class]="getTypeButtonClasses('private')"
              >
                <i name="lock" class="w-5 h-5"></i>
                <div class="text-left">
                  <div class="font-semibold">Privé</div>
                  <div class="text-xs opacity-80">Sur invitation uniquement</div>
                </div>
              </button>
              <button
                type="button"
                (click)="setClubType('public')"
                [class]="getTypeButtonClasses('public')"
              >
                <i name="globe" class="w-5 h-5"></i>
                <div class="text-left">
                  <div class="font-semibold">Public</div>
                  <div class="text-xs opacity-80">Ouvert à tous</div>
                </div>
              </button>
            </div>
          </div>

          <div class="flex justify-end gap-3 pt-4">
            <ui-button
              variant="ghost"
              type="button"
              (clicked)="close.emit()"
            >
              Annuler
            </ui-button>
            <ui-button
              variant="primary"
              type="submit"
              [loading]="isCreating()"
              [disabled]="isCreating() || !isCreateFormValid()"
            >
              Créer le club
            </ui-button>
          </div>
        </form>
      }

      <!-- Join Club Form -->
      @if (activeTab() === 'join') {
        <form (ngSubmit)="onJoinClub()" class="space-y-4">
          <ui-input
            inputId="invitation-code"
            type="text"
            label="Code d'invitation"
            placeholder="Ex: ABC-123-XYZ"
            [control]="invitationCodeControl"
            [required]="true"
            autocomplete="off"
            hint="Demandez un code d'invitation au créateur du club"
          />

          <div class="flex justify-end gap-3 pt-4">
            <ui-button
              variant="ghost"
              type="button"
              (clicked)="close.emit()"
            >
              Annuler
            </ui-button>
            <ui-button
              variant="primary"
              type="submit"
              [loading]="isJoining()"
              [disabled]="isJoining() || invitationCodeControl.invalid"
            >
              Rejoindre
            </ui-button>
          </div>
        </form>
      }
    </ui-modal>
  `,
})
export class CreateJoinClubModalComponent {
  readonly isOpen = input<boolean>(false);
  readonly close = output<void>();
  readonly clubCreated = output<void>();
  readonly clubJoined = output<void>();

  readonly activeTab: WritableSignal<ModalTab> = signal<ModalTab>('create');
  readonly clubType: WritableSignal<'private' | 'public'> = signal<'private' | 'public'>('private');
  readonly isCreating: WritableSignal<boolean> = signal<boolean>(false);
  readonly isJoining: WritableSignal<boolean> = signal<boolean>(false);

  // Create Club Form
  readonly nameControl = new FormControl('', [Validators.required, Validators.maxLength(50)]);
  readonly descriptionControl = new FormControl('', [Validators.maxLength(200)]);

  // Join Club Form
  readonly invitationCodeControl = new FormControl('', [Validators.required]);

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
    return this.nameControl.valid;
  }

  async onCreateClub(): Promise<void> {
    if (!this.isCreateFormValid()) {
      return;
    }

    this.isCreating.set(true);

    try {
      // TODO: Call API to create club
      const clubData = {
        name: this.nameControl.value!,
        description: this.descriptionControl.value || null,
        type: this.clubType(),
      };

      console.log('[CreateJoinClubModal] Creating club:', clubData);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      this.clubCreated.emit();
      this.resetForms();
      this.close.emit();
    } catch (error) {
      console.error('[CreateJoinClubModal] Error creating club:', error);
      // TODO: Show error toast
    } finally {
      this.isCreating.set(false);
    }
  }

  async onJoinClub(): Promise<void> {
    if (this.invitationCodeControl.invalid) {
      return;
    }

    this.isJoining.set(true);

    try {
      // TODO: Call API to join club with invitation code
      const code = this.invitationCodeControl.value!;
      console.log('[CreateJoinClubModal] Joining club with code:', code);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      this.clubJoined.emit();
      this.resetForms();
      this.close.emit();
    } catch (error) {
      console.error('[CreateJoinClubModal] Error joining club:', error);
      // TODO: Show error toast
    } finally {
      this.isJoining.set(false);
    }
  }

  resetForms(): void {
    this.nameControl.reset();
    this.descriptionControl.reset();
    this.invitationCodeControl.reset();
    this.clubType.set('private');
    this.activeTab.set('create');
  }
}
