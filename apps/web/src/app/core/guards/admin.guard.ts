import { CanActivateFn } from '@angular/router';
import { roleGuard } from './role.guard';
import { Role } from '@cigar-platform/types';

/**
 * Admin Guard
 * Protects routes that require ADMIN role
 * Redirects to home if user is authenticated but not admin
 * Redirects to login if user is not authenticated
 */
export const adminGuard: CanActivateFn = roleGuard([Role.ADMIN]);