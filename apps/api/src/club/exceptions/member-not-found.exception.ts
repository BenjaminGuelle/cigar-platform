import { NotFoundException } from '@nestjs/common';

export class MemberNotFoundException extends NotFoundException {
  constructor(userId: string, clubId: string) {
    super({
      error: 'MEMBER_NOT_FOUND',
      message: `User "${userId}" is not a member of club "${clubId}"`,
      statusCode: 404,
    });
  }
}
