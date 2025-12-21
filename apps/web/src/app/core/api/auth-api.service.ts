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
    return this.#callerService.post<SignUpRequest, AuthResponseModel>(
      '/auth/signup',
      request
    );
  }

  signIn(request: SignInRequest): Observable<ApiResponse<AuthResponseModel>> {
    return this.#callerService.post<SignInRequest, AuthResponseModel>(
      '/auth/signin',
      request
    );
  }

  getProfile(): Observable<ApiResponse<UserModel>> {
    return this.#callerService.get<UserModel>('/auth/profile');
  }

  updateProfile(request: UpdateProfileRequest): Observable<ApiResponse<UserModel>> {
    return this.#callerService.patch<UpdateProfileRequest, UserModel>(
      '/auth/profile',
      request
    );
  }

  signOut(): Observable<ApiResponse<void>> {
    return this.#callerService.post<void, void>('/auth/signout', undefined);
  }
}
