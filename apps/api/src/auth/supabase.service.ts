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

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error(
        'SUPABASE_URL and SUPABASE_ANON_KEY must be defined in environment variables'
      );
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Get the Supabase client instance
   */
  getClient(): SupabaseClient {
    return this.supabase;
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