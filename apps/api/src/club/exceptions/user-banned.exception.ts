import { ForbiddenException } from '@nestjs/common';

export class UserBannedException extends ForbiddenException {
  constructor(userId: string, clubId: string) {
    super({
      error: 'USER_BANNED',
      message: `User "${userId}" is banned from club "${clubId}"`,
      statusCode: 403,
    });
  }
}
