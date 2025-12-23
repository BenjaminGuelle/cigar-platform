import type { ClubRole } from '@cigar-platform/prisma-client';

export interface AddClubMemberRequest {
  userId: string;
  role?: ClubRole;
}
