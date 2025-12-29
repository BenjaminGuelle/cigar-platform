import { inject } from '@angular/core';
import { AbstractControl, AsyncValidatorFn, ValidationErrors } from '@angular/forms';
import { Observable, of, timer } from 'rxjs';
import { map, catchError, switchMap, take } from 'rxjs/operators';
import { UsersService } from '@cigar-platform/types/lib/users/users.service';

/**
 * Async Validator: Check if username is available
 *
 * @param currentUserId - Optional current user ID (to exclude from check when updating own profile)
 * @param debounceTime - Debounce time in milliseconds (default: 500ms)
 * @returns AsyncValidatorFn
 *
 * @example
 * ```ts
 * username: ['', [Validators.required], [usernameAvailabilityValidator(currentUserId)]]
 * ```
 */
export function usernameAvailabilityValidator(
  currentUserId?: string,
  debounceTime: number = 500
): AsyncValidatorFn {
  // ✅ Inject service in injection context (factory function)
  const usersService = inject(UsersService);

  // Return validator function that uses the captured service
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    const username = control.value;

    // Don't validate if empty (handled by required validator)
    if (!username || username.length < 3) {
      return of(null);
    }

    // Debounce + API call
    return timer(debounceTime).pipe(
      switchMap(() =>
        usersService.usersControllerCheckUsernameAvailability(username, {
          ...(currentUserId && { currentUserId }),
        })
      ),
      map((response) => {
        // If username is NOT available, return error
        return response.available ? null : { usernameTaken: true };
      }),
      catchError(() => {
        // On error, assume username is available (fail gracefully)
        return of(null);
      }),
      take(1)
    );
  };
}