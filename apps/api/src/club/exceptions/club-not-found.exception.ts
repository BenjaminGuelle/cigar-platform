import { NotFoundException } from '@nestjs/common';

export class ClubNotFoundException extends NotFoundException {
  constructor(clubId: string) {
    super({
      error: 'CLUB_NOT_FOUND',
      message: `Club with ID "${clubId}" not found`,
      statusCode: 404,
    });
  }
}