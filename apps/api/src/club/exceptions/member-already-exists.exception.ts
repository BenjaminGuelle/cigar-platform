import { ConflictException } from '@nestjs/common';

export class MemberAlreadyExistsException extends ConflictException {
  constructor(userId: string, clubId: string) {
    super(`User "${userId}" is already a member of club "${clubId}"`);
  }
}
