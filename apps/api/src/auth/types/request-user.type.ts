import { Request } from 'express';
import { User } from '@supabase/supabase-js';
import { Role } from '@cigar-platform/prisma-client';

/**
 * Custom metadata stored in Supabase JWT (app_metadata)
 * Synced automatically via database trigger
 */
export interface AppMetadata {
  role: Role;
  displayName: string;
  provider?: 'google' | 'apple' | 'email';
}

/**
 * User metadata from OAuth providers (user_metadata)
 */
export interface UserMetadata {
  full_name?: string;
  name?: string;
  avatar_url?: string;
}

/**
 * Partial Prisma User data attached to request
 * Either from JWT custom claims (optimized) or DB query (fallback)
 */
export interface RequestDbUser {
  id: string;
  email: string;
  displayName: string;
  role: Role;
  avatarUrl: string | null;
  createdAt: Date;
}

/**
 * Extended Supabase User with our custom fields
 * This is the type of request.user in authenticated requests
 */
export interface RequestUser extends User {
  app_metadata: AppMetadata;
  user_metadata: UserMetadata;
  dbUser: RequestDbUser;
  authProvider: 'google' | 'apple' | 'email';
}

/**
 * Express Request with authenticated user
 */
export interface AuthenticatedRequest extends Request {
  user: RequestUser;
}
