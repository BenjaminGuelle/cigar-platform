import { ClubRole } from './enums';

export interface ClubMember {
  id: string;
  clubId: string;
  userId: string;
  role: ClubRole;
  joinedAt: Date;
}

export interface AddClubMemberDto {
  userId: string;
  role?: ClubRole;
}

export interface UpdateClubMemberDto {
  role: ClubRole;
}