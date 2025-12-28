import { BadRequestException } from '@nestjs/common';

export class CannotTransferToSelfException extends BadRequestException {
  constructor() {
    super('Cannot transfer ownership to yourself');
  }
}
