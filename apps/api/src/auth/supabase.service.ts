import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';

/**
 * Service for managing Supabase client and authentication
 * Uses Supabase Auth for user management and JWT validation
 */
@Injectable()
export class SupabaseService implements OnModuleInit {
  private supabase: SupabaseClient;
  private supabaseAdmin: SupabaseClient;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const publishableKey = this.configService.get<string>('SUPABASE_PUBLISHABLE_KEY');
    const secretKey = this.configService.get<string>('SUPABASE_SECRET_KEY');

    if (!supabaseUrl || !publishableKey) {
      throw new Error(
        'SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY must be defined in environment variables'
      );
    }

    if (!secretKey) {
      throw new Error(
        'SUPABASE_SECRET_KEY must be defined in environment variables'
      );
    }

    // Client for auth operations (with publishable key)
    this.supabase = createClient(supabaseUrl, publishableKey);

    // Admin client for backend operations (bypasses RLS)
    this.supabaseAdmin = createClient(supabaseUrl, secretKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  /**
   * Get the Supabase client instance (for auth operations)
   */
  getClient(): SupabaseClient {
    return this.supabase;
  }

  /**
   * Get the Supabase admin client (for backend operations, bypasses RLS)
   * ⚠️ USE WITH CAUTION - This client has full access
   */
  getAdminClient(): SupabaseClient {
    return this.supabaseAdmin;
  }

  /**
   * Verify a JWT token and return the user
   */
  async verifyToken(token: string): Promise<User | null> {
    const {
      data: { user },
      error,
    } = await this.supabase.auth.getUser(token);

    if (error || !user) {
      return null;
    }

    return user;
  }
}