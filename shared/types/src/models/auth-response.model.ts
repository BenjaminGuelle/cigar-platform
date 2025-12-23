import type { UserDto } from '../lib/generated-api.schemas';

/**
 * Authentication provider type
 * Indicates how the user authenticated (OAuth or email/password)
 */
export type AuthProvider = 'google' | 'apple' | 'email';

/**
 * User with authentication provider info
 * Uses Orval-generated UserDto as base
 */
export type UserWithAuth = UserDto;
