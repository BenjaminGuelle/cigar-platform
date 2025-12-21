import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  SignUpRequest,
  SignInRequest,
  UpdateProfileRequest,
  UserModel,
  AuthResponseModel,
} from '@cigar-platform/types';
import { CallerService, ApiResponse } from '../services/caller.service';

@Injectable({
  providedIn: 'root',
})
export class AuthApiService {
  #callerService = inject(CallerService);

  signUp(request: SignUpRequest): Observable<ApiResponse<AuthResponseModel>> {
    return this.#callerService.call('AUTH_SIGNUP', { request });
  }

  signIn(request: SignInRequest): Observable<ApiResponse<AuthResponseModel>> {
    return this.#callerService.call('AUTH_SIGNIN', { request });
  }

  getProfile(): Observable<ApiResponse<UserModel>> {
    return this.#callerService.call('AUTH_PROFILE');
  }

  updateProfile(request: UpdateProfileRequest): Observable<ApiResponse<UserModel>> {
    return this.#callerService.call('AUTH_UPDATE_PROFILE', { request });
  }

  signOut(): Observable<ApiResponse<void>> {
    return this.#callerService.call('AUTH_SIGNOUT');
  }
}
