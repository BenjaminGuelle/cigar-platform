import { Component, input, output, signal, WritableSignal, computed, Signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { ModalComponent, InputComponent, ButtonComponent } from '@cigar-platform/shared/ui';

/**
 * Create Event Modal
 * Simple modal to create a club event
 * Only available in club context
 */
@Component({
  selector: 'app-create-content-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent, InputComponent, ButtonComponent],
  template: `
    <ui-modal
      [isOpen]="isOpen()"
      size="md"
      position="bottom-right"
      (close)="close.emit()"
    >
      <!-- Header -->
      <div class="mb-6">
        <h2 id="modal-title" class="text-2xl font-display text-smoke-50 mb-2">
          Nouvel événement
        </h2>
        <p class="text-sm text-smoke-400">
          {{ contextClubName() ? 'Organisez un événement pour ' + contextClubName() : 'Organisez un événement pour votre club' }}
        </p>
      </div>

      <!-- Event Form -->
      <form (ngSubmit)="onCreateEvent()" class="space-y-4">
          <ui-input
            inputId="event-title"
            type="text"
            label="Titre de l'événement"
            placeholder="Ex: Soirée dégustation Cubains"
            [control]="eventTitleControl"
            [required]="true"
            autocomplete="off"
          />

          <ui-input
            inputId="event-description"
            type="text"
            label="Description (optionnel)"
            placeholder="Ex: Découverte des grands crus cubains..."
            [control]="eventDescriptionControl"
            [maxlength]="500"
            autocomplete="off"
          />

          <ui-input
            inputId="event-date"
            type="text"
            label="Date (optionnel)"
            placeholder="Ex: Samedi 28 décembre"
            [control]="eventDateControl"
            autocomplete="off"
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
              [loading]="isCreatingEvent()"
              [disabled]="isCreatingEvent() || eventTitleControl.invalid"
            >
              Créer l'événement
            </ui-button>
          </div>
      </form>
    </ui-modal>
  `,
})
export class CreateContentModalComponent {
  readonly isOpen = input<boolean>(false);
  readonly contextClubName = input<string | null>(null);
  readonly close = output<void>();
  readonly eventCreated = output<void>();

  readonly isCreatingEvent: WritableSignal<boolean> = signal<boolean>(false);

  // Event Form
  readonly eventTitleControl = new FormControl('', [Validators.required]);
  readonly eventDescriptionControl = new FormControl('', [Validators.maxLength(500)]);
  readonly eventDateControl = new FormControl('');

  async onCreateEvent(): Promise<void> {
    if (this.eventTitleControl.invalid) {
      return;
    }

    this.isCreatingEvent.set(true);

    try {
      // TODO: Call API to create event
      const eventData = {
        title: this.eventTitleControl.value!,
        description: this.eventDescriptionControl.value || null,
        date: this.eventDateControl.value || null,
      };

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      this.eventCreated.emit();
      this.resetForm();
      this.close.emit();
    } catch (error) {
      // TODO: Show error toast
    } finally {
      this.isCreatingEvent.set(false);
    }
  }

  resetForm(): void {
    this.eventTitleControl.reset();
    this.eventDescriptionControl.reset();
    this.eventDateControl.reset();
  }
}
