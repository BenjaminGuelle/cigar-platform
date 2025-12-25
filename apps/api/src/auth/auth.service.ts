import { Injectable } from '@nestjs/common';
import type { Session } from '@supabase/supabase-js';
import { User } from '@cigar-platform/prisma-client';
import { SupabaseService } from './supabase.service';
import { PrismaService } from '../app/prisma.service';
import {
  SignUpDto,
  SignInDto,
  UpdateProfileDto,
  AuthResponseDto,
  UserDto,
} from './dto';
import {
  EmailConfirmationRequiredException,
  InvalidCredentialsException,
  UserAlreadyExistsException,
  UserNotFoundException,
  AccountCreationFailedException,
} from '../common/exceptions';

/**
 * Service handling authentication business logic
 * Integrates Supabase Auth with Prisma database
 */
@Injectable()
export class AuthService {
  constructor(
    private supabaseService: SupabaseService,
    private prismaService: PrismaService
  ) {}

  /**
   * Sign up a new user with email/password
   */
  async signUp(dto: SignUpDto): Promise<AuthResponseDto> {
    const supabase = this.supabaseService.getClient();

    // Create user in Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email: dto.email,
      password: dto.password,
    });

    if (error) {
      // Check for specific Supabase errors
      if (error.message.includes('already registered')) {
        throw new UserAlreadyExistsException();
      }
      throw new AccountCreationFailedException(error.message);
    }

    if (!data.user) {
      throw new AccountCreationFailedException();
    }

    // Check if email confirmation is required (session is null when confirmation is needed)
    if (!data.session) {
      throw new EmailConfirmationRequiredException();
    }

    // Create user in Prisma database
    const user = await this.prismaService.user.create({
      data: {
        id: data.user.id,
        email: dto.email,
        displayName: dto.displayName,
      },
    });

    return this.buildAuthResponse(user, data.session);
  }

  /**
   * Sign in an existing user
   */
  async signIn(dto: SignInDto): Promise<AuthResponseDto> {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: dto.email,
      password: dto.password,
    });

    if (error || !data.user || !data.session) {
      throw new InvalidCredentialsException();
    }

    // Fetch user from database
    const user = await this.prismaService.user.findUnique({
      where: { id: data.user.id },
    });

    if (!user) {
      throw new UserNotFoundException(
        'User exists in authentication but not in database. Please contact support.'
      );
    }

    return this.buildAuthResponse(user, data.session);
  }

  /**
   * Sign out the current user
   */
  async signOut(userId: string): Promise<void> {
    const supabase = this.supabaseService.getClient();
    await supabase.auth.signOut();
  }

  /**
   * Get current user profile
   */
  async getProfile(userId: string, authProvider?: string): Promise<UserDto> {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UserNotFoundException();
    }

    const userDto = this.mapUserToDto(user);

    // Add authProvider from Supabase metadata (not stored in DB)
    if (authProvider) {
      userDto.authProvider = authProvider as 'google' | 'apple' | 'email';
    }

    return userDto;
  }

  /**
   * Update user profile (upsert to handle virtual dbUser from JwtAuthGuard)
   */
  async updateProfile(
    dbUser: any,
    dto: UpdateProfileDto
  ): Promise<UserDto> {
    // Upsert: create user if doesn't exist (OAuth with custom claims case)
    const user = await this.prismaService.user.upsert({
      where: { id: dbUser.id },
      update: {
        ...(dto.displayName && { displayName: dto.displayName }),
        ...(dto.avatarUrl !== undefined && { avatarUrl: dto.avatarUrl }),
      },
      create: {
        id: dbUser.id,
        email: dbUser.email,
        displayName: dto.displayName || dbUser.displayName,
        avatarUrl: dto.avatarUrl !== undefined ? dto.avatarUrl : dbUser.avatarUrl,
        role: dbUser.role || 'USER', // Prisma Role enum: USER, MODERATOR, SUPER_ADMIN
      },
    });

    return this.mapUserToDto(user);
  }

  /**
   * Map Prisma User to UserDto
   */
  private mapUserToDto(user: User): UserDto {
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      role: user.role as unknown as UserDto['role'],
      createdAt: user.createdAt,
    };
  }

  /**
   * Build UserDto from user data (public for use in controllers)
   * Accepts both Prisma User and virtual dbUser from JwtAuthGuard
   */
  buildUserDto(user: any, authProvider?: string): UserDto {
    const userDto: UserDto = {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      role: user.role as unknown as UserDto['role'],
      createdAt: user.createdAt instanceof Date ? user.createdAt : new Date(user.createdAt),
    };

    if (authProvider) {
      userDto.authProvider = authProvider as 'google' | 'apple' | 'email';
    }

    return userDto;
  }

  /**
   * Build authentication response with user and session data
   */
  private buildAuthResponse(user: User, session: Session): AuthResponseDto {
    return {
      user: this.mapUserToDto(user),
      session,
    };
  }
}