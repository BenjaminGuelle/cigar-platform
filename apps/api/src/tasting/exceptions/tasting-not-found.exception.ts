import { NotFoundException } from '@nestjs/common';

export class TastingNotFoundException extends NotFoundException {
  constructor(tastingId: string) {
    super(`Tasting with ID "${tastingId}" not found`);
  }
}
