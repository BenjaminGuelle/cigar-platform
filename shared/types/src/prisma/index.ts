/**
 * Centralized Prisma types for reuse across backend services
 *
 * These types are generated from Prisma schema and provide type-safe
 * access to database models and their relations.
 *
 * @see prisma/schema.prisma
 */

export * from './user.types';
export * from './club.types';

// Re-export Prisma namespace for advanced usage
export { Prisma } from '@cigar-platform/prisma-client';
