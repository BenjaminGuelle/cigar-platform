import { NotFoundException } from '@nestjs/common';

export class MemberNotFoundException extends NotFoundException {
  constructor(userId: string, clubId: string) {
    super(`User "${userId}" is not a member of club "${clubId}"`);
  }
}
