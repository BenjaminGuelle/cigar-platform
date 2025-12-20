import { ErrorCode } from './error-codes.enum';

/**
 * Validation error detail
 */
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

/**
 * Error detail object
 */
export interface ErrorDetail {
  code: ErrorCode | string;
  message: string;
  details?: string;
  statusCode: number;
  timestamp: string;
  path: string;
  validationErrors?: ValidationError[];
}

/**
 * Standardized error response
 */
export interface ErrorResponse {
  success: false;
  error: ErrorDetail;
}

/**
 * Success response wrapper
 */
export interface SuccessResponse<T = any> {
  success: true;
  data: T;
}

/**
 * Generic API response
 */
export type ApiResponse<T = any> = SuccessResponse<T> | ErrorResponse;