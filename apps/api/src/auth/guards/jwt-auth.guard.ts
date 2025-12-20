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

    // Auto-sync: Check if user exists in Prisma, create if not
    let dbUser = await this.prismaService.user.findUnique({
      where: { id: supabaseUser.id },
    });

    if (!dbUser) {
      // User exists in Supabase but not in our DB (OAuth first login)
      // Create user automatically with data from Supabase
      this.logger.log(
        `Auto-creating user ${supabaseUser.email} from OAuth/Supabase`
      );

      dbUser = await this.prismaService.user.create({
        data: {
          id: supabaseUser.id,
          email: supabaseUser.email!,
          displayName:
            supabaseUser.user_metadata?.full_name ||
            supabaseUser.user_metadata?.name ||
            supabaseUser.email?.split('@')[0] ||
            'User',
          avatarUrl: supabaseUser.user_metadata?.avatar_url || null,
        },
      });

      this.logger.log(`User ${dbUser.email} auto-created successfully`);
    }

    // Attach Prisma user to request for use in controllers
    request.user = { ...supabaseUser, dbUser };
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