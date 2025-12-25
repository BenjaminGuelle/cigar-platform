import { BadRequestException } from '@nestjs/common';

export class CannotTransferToSelfException extends BadRequestException {
  constructor() {
    super({
      error: 'CANNOT_TRANSFER_TO_SELF',
      message: 'Cannot transfer ownership to yourself',
      statusCode: 400,
    });
  }
}
