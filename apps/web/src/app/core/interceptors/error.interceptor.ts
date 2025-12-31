import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

/**
 * Custom HTTP Error class that preserves status code
 */
export class HttpError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly url: string | null = null
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'An unexpected error occurred';

      if (error.error instanceof ErrorEvent) {
        errorMessage = `Error: ${error.error.message}`;
      } else {
        if (error.status === 0) {
          errorMessage = 'Unable to connect to server';
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        } else {
          errorMessage = `Server error: ${error.status} ${error.statusText}`;
        }
      }

      return throwError(() => new HttpError(errorMessage, error.status, error.url));
    })
  );
};