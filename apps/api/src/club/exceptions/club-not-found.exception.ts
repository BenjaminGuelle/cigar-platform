import { NotFoundException } from '@nestjs/common';

export class ClubNotFoundException extends NotFoundException {
  constructor(clubId: string) {
    super(`Club with ID "${clubId}" not found`);
  }
}