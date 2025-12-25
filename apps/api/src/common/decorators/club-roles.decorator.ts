import { SetMetadata } from '@nestjs/common';
import { ClubRole } from '@cigar-platform/prisma-client';

export const CLUB_ROLES_KEY = 'clubRoles';

/**
 * Decorator to specify required club roles for a route
 * Usage: @ClubRoles(ClubRole.owner, ClubRole.admin)
 */
export const ClubRoles = (...roles: ClubRole[]) => SetMetadata(CLUB_ROLES_KEY, roles);
