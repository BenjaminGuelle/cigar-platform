import { ForbiddenException } from '@nestjs/common';

export class TastingForbiddenException extends ForbiddenException {
  constructor(action: string) {
    super(`You do not have permission to ${action} this tasting`);
  }
}
