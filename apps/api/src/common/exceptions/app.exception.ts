import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode } from '../../../../../shared/types/src/error';

/**
 * Base application exception with custom error codes
 */
export class AppException extends HttpException {
  constructor(
    public readonly code: ErrorCode | string,
    message: string,
    public readonly details?: string,
    statusCode: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR
  ) {
    super(
      {
        code,
        message,
        details,
      },
      statusCode
    );
  }
}