import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

/**
 * API response wrapper from TransformInterceptor
 */
interface ApiResponse<T> {
  success: boolean;
  data: T;
}

/**
 * Custom HTTP instance for Orval-generated services
 * Automatically unwraps the API response wrapper { success: true, data: T }
 */
export const customInstance = <T>(
  config: {
    url: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    params?: any;
    data?: any;
    headers?: any;
  },
  http: HttpClient
): Promise<T> => {
  // Prefix URL with API base URL (http://localhost:3000)
  const baseUrl = environment.apiUrl.replace('/api', ''); // Remove /api suffix if present
  const { url, method, params, data, headers } = config;
  const fullUrl = `${baseUrl}${url}`;

  // DEBUG: Remove after fixing
  console.log('[API DEBUG]', { apiUrl: environment.apiUrl, baseUrl, url, fullUrl });

  // Fix FormData uploads: Remove Content-Type header to let browser set it with boundary
  let finalHeaders = headers;
  if (data instanceof FormData && headers?.['Content-Type'] === 'multipart/form-data') {
    finalHeaders = { ...headers };
    delete finalHeaders['Content-Type'];
  }

  const unwrapResponse = (response: ApiResponse<T> | null | undefined): T => {
    // Handle empty responses (204 No Content, void from DELETE/PUT/PATCH)
    if (!response || response === null || response === undefined) {
      return undefined as T;
    }
    return response.data;
  };

  switch (method) {
    case 'GET':
      return lastValueFrom(
        http.get<ApiResponse<T>>(fullUrl, { params, headers: finalHeaders }).pipe(map(unwrapResponse))
      );
    case 'POST':
      return lastValueFrom(
        http.post<ApiResponse<T>>(fullUrl, data, { params, headers: finalHeaders }).pipe(map(unwrapResponse))
      );
    case 'PUT':
      return lastValueFrom(
        http.put<ApiResponse<T>>(fullUrl, data, { params, headers: finalHeaders }).pipe(map(unwrapResponse))
      );
    case 'PATCH':
      return lastValueFrom(
        http.patch<ApiResponse<T>>(fullUrl, data, { params, headers: finalHeaders }).pipe(map(unwrapResponse))
      );
    case 'DELETE':
      return lastValueFrom(
        http.delete<ApiResponse<T>>(fullUrl, { params, headers: finalHeaders }).pipe(map(unwrapResponse))
      );
    default:
      throw new Error(`Unsupported method: ${method}`);
  }
};
