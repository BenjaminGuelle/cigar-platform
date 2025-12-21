import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  API_ROUTES,
  ApiRoute,
  RouteParams,
  RouteRequest,
  RouteResponse,
  RouteMethod,
  buildUrl,
} from '../api/api-routes';

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

  /**
   * Type-safe API call using centralized route definitions
   * Provides autocompletion for route keys and automatic type inference
   *
   * @example
   * // GET request without params/body
   * this.call('AUTH_PROFILE')
   *
   * @example
   * // POST request with body
   * this.call('AUTH_SIGNUP', { request: { email, password, displayName } })
   *
   * @example
   * // GET request with path params
   * this.call('CLUBS_GET', { params: { id: '123' } })
   *
   * @example
   * // PATCH request with path params and body
   * this.call('CLUBS_UPDATE', { params: { id: '123' }, request: { name: 'New Name' } })
   */
  call<K extends ApiRoute>(
    route: K,
    options?: {
      params?: RouteParams<K>;
      request?: RouteRequest<K>;
    }
  ): Observable<RouteResponse<K>> {
    const routeConfig = API_ROUTES[route];
    const url = buildUrl(routeConfig.endpoint, options?.params as Record<string, string> | void);
    const fullUrl = `${this.#baseUrl}${url}`;
    const method = routeConfig.method as RouteMethod<K>;

    switch (method) {
      case 'GET':
        return this.#http.get<RouteResponse<K>>(fullUrl);
      case 'POST':
        return this.#http.post<RouteResponse<K>>(fullUrl, options?.request);
      case 'PATCH':
        return this.#http.patch<RouteResponse<K>>(fullUrl, options?.request);
      case 'DELETE':
        return this.#http.delete<RouteResponse<K>>(fullUrl);
      default:
        throw new Error(`Unsupported HTTP method: ${method}`);
    }
  }

  // ============================================
  // Legacy methods (kept for backward compatibility)
  // ============================================

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
