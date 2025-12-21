import { ClubRole } from '../enums';

export interface AddClubMemberRequest {
  userId: string;
  role?: ClubRole;
}
