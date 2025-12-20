import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SupabaseService } from './supabase.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

/**
 * Authentication module
 * Provides Supabase-based authentication with JWT validation
 */
@Module({
  imports: [ConfigModule],
  controllers: [AuthController],
  providers: [AuthService, SupabaseService, JwtAuthGuard],
  exports: [SupabaseService, JwtAuthGuard],
})
export class AuthModule {}