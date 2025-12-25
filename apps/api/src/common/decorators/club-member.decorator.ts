import { SetMetadata } from '@nestjs/common';

export const IS_CLUB_MEMBER_KEY = 'isClubMember';

/**
 * Decorator to mark routes that require club membership
 * Usage: @ClubMember()
 */
export const ClubMember = () => SetMetadata(IS_CLUB_MEMBER_KEY, true);
