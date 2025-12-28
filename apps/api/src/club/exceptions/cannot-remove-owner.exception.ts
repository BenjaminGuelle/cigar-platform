import { ForbiddenException } from '@nestjs/common';

export class CannotRemoveOwnerException extends ForbiddenException {
  constructor() {
    super('Cannot remove club owner. Transfer ownership first.');
  }
}
