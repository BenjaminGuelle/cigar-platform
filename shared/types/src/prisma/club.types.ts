import { Prisma } from '@cigar-platform/prisma-client';

/**
 * Base Club type from Prisma
 * Includes all fields from the Club model
 */
export type Club = Prisma.ClubGetPayload<object>;

/**
 * Club with members
 */
export type ClubWithMembers = Prisma.ClubGetPayload<{
  include: { members: true };
}>;

/**
 * Club with all relations
 */
export type ClubWithRelations = Prisma.ClubGetPayload<{
  include: {
    creator: true;
    members: true;
    events: true;
  };
}>;
