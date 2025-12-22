import { Prisma } from '@cigar-platform/prisma-client';

/**
 * Base User type from Prisma
 * Includes all fields from the User model
 */
export type User = Prisma.UserGetPayload<object>;

/**
 * User with club memberships
 */
export type UserWithClubs = Prisma.UserGetPayload<{
  include: { clubMemberships: true };
}>;

/**
 * User with all relations
 */
export type UserWithRelations = Prisma.UserGetPayload<{
  include: {
    clubMemberships: true;
    createdClubs: true;
    evaluations: true;
    createdCigars: true;
    createdEvents: true;
  };
}>;
