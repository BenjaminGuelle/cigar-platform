import { SetMetadata } from '@nestjs/common';

/**
 * Public decorator to mark routes as publicly accessible (bypass JWT auth)
 *
 * Usage:
 * @Get('public-route')
 * @Public()
 * async getPublicData() { ... }
 */
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);