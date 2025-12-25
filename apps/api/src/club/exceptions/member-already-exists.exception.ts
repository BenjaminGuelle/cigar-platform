import { ConflictException } from '@nestjs/common';

export class MemberAlreadyExistsException extends ConflictException {
  constructor(userId: string, clubId: string) {
    super({
      error: 'MEMBER_ALREADY_EXISTS',
      message: `User "${userId}" is already a member of club "${clubId}"`,
      statusCode: 409,
    });
  }
}
