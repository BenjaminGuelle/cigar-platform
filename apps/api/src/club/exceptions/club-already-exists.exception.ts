import { ConflictException } from '@nestjs/common';

export class ClubAlreadyExistsException extends ConflictException {
  constructor(clubName: string) {
    super({
      error: 'CLUB_ALREADY_EXISTS',
      message: `Club with name "${clubName}" already exists`,
      statusCode: 409,
    });
  }
}