import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

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

      console.error('[HTTP Error]', {
        status: error.status,
        message: errorMessage,
        url: error.url,
      });

      return throwError(() => new Error(errorMessage));
    })
  );
};