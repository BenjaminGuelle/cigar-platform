import { SetMetadata } from '@nestjs/common';
import { Role } from '@cigar-platform/prisma-client';

export const ROLES_KEY = 'roles';

/**
 * Roles Decorator
 *
 * Sets the required roles metadata for a route handler.
 * Used with RolesGuard to restrict access to specific roles.
 *
 * @example
 * @Roles(Role.ADMIN)
 * @Get('admin-only')
 * getAdminData() { ... }
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);