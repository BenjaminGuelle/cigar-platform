import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import {
  ErrorResponse,
  ErrorCode,
  ValidationError,
} from '../../../../../shared/types/src/error';
import { AppException } from '../exceptions/app.exception';

/**
 * Global exception filter that standardizes all error responses
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let code: ErrorCode | string = ErrorCode.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let details: string | undefined;
    let validationErrors: ValidationError[] | undefined;

    // Handle AppException (our custom exceptions)
    if (exception instanceof AppException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse() as any;
      code = exceptionResponse.code || exception.code;
      message = exceptionResponse.message || exception.message;
      details = exceptionResponse.details || exception.details;
    }
    // Handle standard NestJS HttpException
    else if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object') {
        const responseObj = exceptionResponse as any;

        // Handle validation errors from class-validator
        if (Array.isArray(responseObj.message)) {
          code = ErrorCode.VALIDATION_ERROR;
          message = 'Validation failed';
          validationErrors = this.formatValidationErrors(responseObj.message);
        } else {
          message = responseObj.message || exception.message;
          code = this.mapHttpStatusToErrorCode(statusCode);
          details = responseObj.error;
        }
      } else {
        message = exceptionResponse as string;
        code = this.mapHttpStatusToErrorCode(statusCode);
      }
    }
    // Handle unknown errors
    else if (exception instanceof Error) {
      message = exception.message;
      this.logger.error(
        `Unhandled error: ${exception.message}`,
        exception.stack
      );
    }

    // Build standardized error response
    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code,
        message,
        details,
        statusCode,
        timestamp: new Date().toISOString(),
        path: request.url,
        validationErrors,
      },
    };

    // Log error for monitoring
    this.logger.error(
      `[${request.method}] ${request.url} - ${statusCode} - ${code}: ${message}`
    );

    response.status(statusCode).json(errorResponse);
  }

  /**
   * Map HTTP status codes to error codes
   */
  private mapHttpStatusToErrorCode(statusCode: number): ErrorCode {
    switch (statusCode) {
      case HttpStatus.BAD_REQUEST:
        return ErrorCode.BAD_REQUEST;
      case HttpStatus.UNAUTHORIZED:
        return ErrorCode.AUTH_UNAUTHORIZED;
      case HttpStatus.FORBIDDEN:
        return ErrorCode.FORBIDDEN;
      case HttpStatus.NOT_FOUND:
        return ErrorCode.NOT_FOUND;
      case HttpStatus.CONFLICT:
        return ErrorCode.VALIDATION_ERROR;
      case HttpStatus.INTERNAL_SERVER_ERROR:
        return ErrorCode.INTERNAL_SERVER_ERROR;
      case HttpStatus.SERVICE_UNAVAILABLE:
        return ErrorCode.SERVICE_UNAVAILABLE;
      default:
        return ErrorCode.INTERNAL_SERVER_ERROR;
    }
  }

  /**
   * Format class-validator errors into our standard format
   */
  private formatValidationErrors(errors: any[]): ValidationError[] {
    return errors.map((error) => {
      if (typeof error === 'string') {
        return {
          field: 'unknown',
          message: error,
        };
      }

      // Handle class-validator error format
      if (error.constraints) {
        return {
          field: error.property,
          message: Object.values(error.constraints).join(', '),
          value: error.value,
        };
      }

      return {
        field: error.property || 'unknown',
        message: error.message || 'Validation error',
      };
    });
  }
}