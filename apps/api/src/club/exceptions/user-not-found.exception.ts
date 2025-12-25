import { NotFoundException } from '@nestjs/common';

export class UserNotFoundException extends NotFoundException {
  constructor(userId: string) {
    super({
      error: 'USER_NOT_FOUND',
      message: `User with ID "${userId}" not found`,
      statusCode: 404,
    });
  }
}
