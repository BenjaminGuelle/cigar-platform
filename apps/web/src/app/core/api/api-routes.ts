import {
  SignUpRequest,
  SignInRequest,
  UpdateProfileRequest,
  UserModel,
  AuthResponseModel,
  ClubModel,
  CreateClubRequest,
} from '@cigar-platform/types';
import { ApiResponse } from '../services/caller.service';

/**
 * Centralized API routes configuration
 * Provides type-safe endpoints with auto-completion
 */
export const API_ROUTES = {
  // ============================================
  // Auth routes
  // ============================================
  AUTH_SIGNUP: {
    endpoint: '/auth/signup',
    method: 'POST',
    params: undefined as void,
    request: {} as SignUpRequest,
    response: {} as ApiResponse<AuthResponseModel>,
  },
  AUTH_SIGNIN: {
    endpoint: '/auth/signin',
    method: 'POST',
    params: undefined as void,
    request: {} as SignInRequest,
    response: {} as ApiResponse<AuthResponseModel>,
  },
  AUTH_PROFILE: {
    endpoint: '/auth/profile',
    method: 'GET',
    params: undefined as void,
    request: undefined as void,
    response: {} as ApiResponse<UserModel>,
  },
  AUTH_UPDATE_PROFILE: {
    endpoint: '/auth/profile',
    method: 'PATCH',
    params: undefined as void,
    request: {} as UpdateProfileRequest,
    response: {} as ApiResponse<UserModel>,
  },
  AUTH_SIGNOUT: {
    endpoint: '/auth/signout',
    method: 'POST',
    params: undefined as void,
    request: undefined as void,
    response: {} as ApiResponse<void>,
  },

  // ============================================
  // Clubs routes
  // ============================================
  CLUBS_LIST: {
    endpoint: '/clubs',
    method: 'GET',
    params: undefined as void,
    request: undefined as void,
    response: {} as ApiResponse<ClubModel[]>,
  },
  CLUBS_CREATE: {
    endpoint: '/clubs',
    method: 'POST',
    params: undefined as void,
    request: {} as CreateClubRequest,
    response: {} as ApiResponse<ClubModel>,
  },
  CLUBS_GET: {
    endpoint: '/clubs/:id',
    method: 'GET',
    params: {} as { id: string },
    request: undefined as void,
    response: {} as ApiResponse<ClubModel>,
  },
  CLUBS_UPDATE: {
    endpoint: '/clubs/:id',
    method: 'PATCH',
    params: {} as { id: string },
    request: {} as CreateClubRequest, // TODO: UpdateClubRequest
    response: {} as ApiResponse<ClubModel>,
  },
  CLUBS_DELETE: {
    endpoint: '/clubs/:id',
    method: 'DELETE',
    params: {} as { id: string },
    request: undefined as void,
    response: {} as ApiResponse<void>,
  },

  // ============================================
  // Future routes (examples)
  // ============================================
  // CLUBS_MEMBERS_LIST: {
  //   endpoint: '/clubs/:clubId/members',
  //   method: 'GET',
  //   params: {} as { clubId: string },
  //   request: {} as void,
  //   response: {} as ApiResponse<ClubMemberModel[]>,
  // },
  // EVENTS_LIST: {
  //   endpoint: '/events',
  //   method: 'GET',
  //   params: {} as void,
  //   request: {} as void,
  //   response: {} as ApiResponse<EventModel[]>,
  // },
} as const;

// ============================================
// Type helpers
// ============================================
export type ApiRoute = keyof typeof API_ROUTES;
export type RouteParams<K extends ApiRoute> = (typeof API_ROUTES)[K]['params'];
export type RouteRequest<K extends ApiRoute> = (typeof API_ROUTES)[K]['request'];
export type RouteResponse<K extends ApiRoute> = (typeof API_ROUTES)[K]['response'];
export type RouteMethod<K extends ApiRoute> = (typeof API_ROUTES)[K]['method'];

/**
 * Build URL by replacing path parameters
 * Example: buildUrl('/clubs/:id', { id: '123' }) => '/clubs/123'
 */
export function buildUrl(
  template: string,
  params: Record<string, string> | void
): string {
  if (!params) return template;

  return Object.entries(params).reduce(
    (url, [key, value]) => url.replace(`:${key}`, encodeURIComponent(value)),
    template
  );
}
