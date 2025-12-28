import { ForbiddenException } from '@nestjs/common';

export class UserBannedException extends ForbiddenException {
  constructor(userId: string, clubId: string) {
    super(`User "${userId}" is banned from club "${clubId}"`);
  }
}
