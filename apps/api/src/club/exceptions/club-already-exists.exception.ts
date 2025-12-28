import { ConflictException } from '@nestjs/common';

export class ClubAlreadyExistsException extends ConflictException {
  constructor(clubName: string) {
    super(`Club with name "${clubName}" already exists`);
  }
}