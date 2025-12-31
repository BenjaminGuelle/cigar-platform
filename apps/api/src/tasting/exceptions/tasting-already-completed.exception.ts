import { BadRequestException } from '@nestjs/common';

export class TastingAlreadyCompletedException extends BadRequestException {
  constructor(tastingId: string) {
    super(
      `Tasting "${tastingId}" is already completed and cannot be modified. Completed tastings are immutable.`
    );
  }
}
