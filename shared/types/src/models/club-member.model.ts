import { ClubRole } from '../enums';

export interface ClubMemberModel {
  id: string;
  clubId: string;
  userId: string;
  role: ClubRole;
  joinedAt: Date;
}
