import { NotFoundException } from '@nestjs/common';

export class ObservationNotFoundException extends NotFoundException {
  constructor(tastingId: string, phase: string) {
    super(`Observation for tasting "${tastingId}" and phase "${phase}" not found`);
  }
}
