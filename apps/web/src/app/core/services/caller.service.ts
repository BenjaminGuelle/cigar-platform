import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

@Injectable({
  providedIn: 'root',
})
export class CallerService {
  #http = inject(HttpClient);
  #baseUrl = environment.apiUrl;

  get<TResponse>(endpoint: string): Observable<ApiResponse<TResponse>> {
    return this.#http.get<ApiResponse<TResponse>>(`${this.#baseUrl}${endpoint}`);
  }

  post<TRequest, TResponse>(
    endpoint: string,
    request: TRequest
  ): Observable<ApiResponse<TResponse>> {
    return this.#http.post<ApiResponse<TResponse>>(
      `${this.#baseUrl}${endpoint}`,
      request
    );
  }

  patch<TRequest, TResponse>(
    endpoint: string,
    request: TRequest
  ): Observable<ApiResponse<TResponse>> {
    return this.#http.patch<ApiResponse<TResponse>>(
      `${this.#baseUrl}${endpoint}`,
      request
    );
  }

  delete<TResponse>(endpoint: string): Observable<ApiResponse<TResponse>> {
    return this.#http.delete<ApiResponse<TResponse>>(`${this.#baseUrl}${endpoint}`);
  }
}
