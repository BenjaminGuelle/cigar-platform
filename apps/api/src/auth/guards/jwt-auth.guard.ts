import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { User } from '@supabase/supabase-js';
import { Request } from 'express';
import { SupabaseService } from '../supabase.service';
import { PrismaService } from '../../app/prisma.service';
import { InvalidTokenException } from '../../common/exceptions';

/**
 * Guard to protect routes with JWT authentication
 * Validates Supabase JWT tokens and auto-syncs users to Prisma database
 *
 * Performance Optimization:
 * - Uses JWT custom claims (role, displayName) when available → NO DB query (99% of requests)
 * - Falls back to DB query + auto-sync on first OAuth login → DB query (1% of requests)
 *
 * This guard ensures that users authenticated via OAuth (Google, Apple, etc.)
 * are automatically created in our Prisma database on first access.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(
    private supabaseService: SupabaseService,
    private prismaService: PrismaService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new InvalidTokenException('No authentication token provided');
    }

    // Verify token and get Supabase user
    const supabaseUser: User | null = await this.supabaseService.verifyToken(token);

    if (!supabaseUser) {
      throw new InvalidTokenException();
    }

    // Check if user has custom claims (role) in JWT
    const hasCustomClaims = !!supabaseUser.app_metadata?.role;

    if (hasCustomClaims) {
      // ✅ OPTIMIZED PATH: Use custom claims from JWT (no DB query)
      this.logger.debug(`User ${supabaseUser.email} authenticated via custom claims`);

      // Build virtual dbUser from JWT claims
      request.user = {
        ...supabaseUser,
        dbUser: {
          id: supabaseUser.id,
          email: supabaseUser.email!,
          displayName: supabaseUser.app_metadata.displayName || supabaseUser.email!,
          role: supabaseUser.app_metadata.role,
          avatarUrl: supabaseUser.user_metadata?.avatar_url ?? null,
          createdAt: new Date(supabaseUser.created_at),
        },
        authProvider: supabaseUser.app_metadata?.provider || 'email',
      };
    } else {
      // ⚠️ FALLBACK PATH: First login or JWT not refreshed yet - Auto-sync from DB
      this.logger.log(`User ${supabaseUser.email} missing custom claims - performing DB sync`);

      let dbUser = await this.prismaService.user.findUnique({
        where: { id: supabaseUser.id },
      });

      if (!dbUser) {
        // User exists in Supabase but not in our DB (OAuth first login)
        // Create user automatically with data from Supabase
        this.logger.log(
          `Auto-creating user ${supabaseUser.email} from OAuth/Supabase`
        );

        // Generate temporary username from email
        // Note: updateProfile in auth.service.ts will generate proper unique username on first save
        const tempUsername = supabaseUser.email!.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 30);

        dbUser = await this.prismaService.user.create({
          data: {
            id: supabaseUser.id,
            email: supabaseUser.email!,
            displayName:
              supabaseUser.user_metadata?.full_name ||
              supabaseUser.user_metadata?.name ||
              supabaseUser.email?.split('@')[0] ||
              'User',
            username: tempUsername,
            avatarUrl: supabaseUser.user_metadata?.avatar_url || null,
          },
        });

        this.logger.log(`User ${dbUser.email} auto-created successfully`);
      }

      // Attach Prisma user to request for use in controllers
      request.user = {
        ...supabaseUser,
        dbUser,
        authProvider: supabaseUser.app_metadata?.provider || 'email',
      };
    }

    return true;
  }

  private extractTokenFromHeader(request: Request): string | null {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      return null;
    }

    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : null;
  }
}