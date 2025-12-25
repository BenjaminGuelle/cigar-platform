import { ForbiddenException } from '@nestjs/common';

export class CannotRemoveOwnerException extends ForbiddenException {
  constructor() {
    super({
      error: 'CANNOT_REMOVE_OWNER',
      message: 'Cannot remove club owner. Transfer ownership first.',
      statusCode: 403,
    });
  }
}
