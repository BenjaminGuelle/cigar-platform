import { HttpStatus } from '@nestjs/common';
import { ErrorCode } from '../../../../../shared/types/src/error';
import { AppException } from './app.exception';

/**
 * Exception for email confirmation required
 */
export class EmailConfirmationRequiredException extends AppException {
  constructor(details?: string) {
    super(
      ErrorCode.AUTH_EMAIL_CONFIRMATION_REQUIRED,
      'Email confirmation required',
      details || 'Please check your email and confirm your account before signing in.',
      HttpStatus.CONFLICT
    );
  }
}

/**
 * Exception for invalid credentials
 */
export class InvalidCredentialsException extends AppException {
  constructor(details?: string) {
    super(
      ErrorCode.AUTH_INVALID_CREDENTIALS,
      'Invalid credentials',
      details || 'The email or password you entered is incorrect.',
      HttpStatus.UNAUTHORIZED
    );
  }
}

/**
 * Exception for user already exists
 */
export class UserAlreadyExistsException extends AppException {
  constructor(details?: string) {
    super(
      ErrorCode.AUTH_USER_ALREADY_EXISTS,
      'User already exists',
      details || 'An account with this email already exists.',
      HttpStatus.CONFLICT
    );
  }
}

/**
 * Exception for user not found
 */
export class UserNotFoundException extends AppException {
  constructor(details?: string) {
    super(
      ErrorCode.AUTH_USER_NOT_FOUND,
      'User not found',
      details || 'No user found with this identifier.',
      HttpStatus.NOT_FOUND
    );
  }
}

/**
 * Exception for invalid or expired token
 */
export class InvalidTokenException extends AppException {
  constructor(details?: string) {
    super(
      ErrorCode.AUTH_INVALID_TOKEN,
      'Invalid or expired token',
      details || 'Your authentication token is invalid or has expired. Please sign in again.',
      HttpStatus.UNAUTHORIZED
    );
  }
}

/**
 * Exception for account creation failure
 */
export class AccountCreationFailedException extends AppException {
  constructor(details?: string) {
    super(
      ErrorCode.AUTH_ACCOUNT_CREATION_FAILED,
      'Account creation failed',
      details || 'Failed to create user account. Please try again.',
      HttpStatus.CONFLICT
    );
  }
}