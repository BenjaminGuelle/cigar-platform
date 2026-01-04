import { Injectable } from '@nestjs/common';
import type { Session } from '@supabase/supabase-js';
import { User, UserVisibility } from '@cigar-platform/prisma-client';
import { SupabaseService } from './supabase.service';
import { PrismaService } from '../app/prisma.service';
import {
  SignUpDto,
  SignInDto,
  AuthResponseDto,
  UserDto,
} from './dto';
import { UpdateProfileDto } from '../users/dto/update-profile.dto';
import {
  EmailConfirmationRequiredException,
  InvalidCredentialsException,
  UserAlreadyExistsException,
  UserNotFoundException,
  AccountCreationFailedException,
} from '../common/exceptions';
import {
  generateUniqueUsername,
  usernameFromEmail,
  slugify,
} from '../common/utils/username.utils';
import { mapRole } from '../common/utils/role.utils';
import { PlanService } from '../plan/plan.service';
import { UserPlanDto } from '../plan/dto';

/**
 * Service handling authentication business logic
 * Integrates Supabase Auth with Prisma database
 */
@Injectable()
export class AuthService {
  constructor(
    private supabaseService: SupabaseService,
    private prismaService: PrismaService,
    private planService: PlanService
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

    // Generate unique username from displayName (or email fallback)
    const username = await this.generateUsername(dto.displayName || dto.email);

    // Create user in Prisma database
    const user = await this.prismaService.user.create({
      data: {
        id: data.user.id,
        email: dto.email,
        displayName: dto.displayName,
        username,
        visibility: UserVisibility.PUBLIC, // Default to PUBLIC
      },
    });

    // Create plan for new user (Beta or Default based on current date)
    const plan = await this.planService.createPlanForNewUser(user.id);

    return this.buildAuthResponse(user, data.session, plan);
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
   * Auto-creates user in DB if doesn't exist (for OAuth users with custom claims)
   */
  async getProfile(userId: string, authProvider?: string, dbUser?: any): Promise<UserDto> {
    let user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    // Auto-create user if doesn't exist (OAuth with custom claims case)
    if (!user && dbUser) {
      const username = await this.generateUsername(dbUser.displayName || dbUser.email);

      user = await this.prismaService.user.create({
        data: {
          id: dbUser.id,
          email: dbUser.email,
          displayName: dbUser.displayName,
          username,
          avatarUrl: dbUser.avatarUrl,
          visibility: UserVisibility.PUBLIC,
          role: mapRole(dbUser.role),
        },
      });
    }

    if (!user) {
      throw new UserNotFoundException();
    }

    const userDto = this.mapUserToDto(user);

    // Add authProvider from Supabase metadata (not stored in DB)
    if (authProvider) {
      userDto.authProvider = authProvider as 'google' | 'apple' | 'email';
    }

    // Add plan
    userDto.plan = await this.planService.getOrCreatePlan(user.id);

    return userDto;
  }

  /**
   * Update user profile (upsert to handle virtual dbUser from JwtAuthGuard)
   */
  async updateProfile(
    dbUser: any,
    dto: UpdateProfileDto
  ): Promise<UserDto> {
    // Generate username only if updating it (or for create path)
    const username = dto.username
      ? dto.username
      : await this.generateUsername(dto.displayName || dbUser.displayName || dbUser.email);

    // Upsert: create user if doesn't exist (OAuth with custom claims case)
    const user = await this.prismaService.user.upsert({
      where: { id: dbUser.id },
      update: {
        ...(dto.displayName && { displayName: dto.displayName }),
        ...(dto.username !== undefined && { username: dto.username }),
        ...(dto.avatarUrl !== undefined && { avatarUrl: dto.avatarUrl }),
        ...(dto.bio !== undefined && { bio: dto.bio }),
        ...(dto.visibility !== undefined && { visibility: dto.visibility }),
        ...(dto.shareEvaluationsPublicly !== undefined && { shareEvaluationsPublicly: dto.shareEvaluationsPublicly }),
      },
      create: {
        id: dbUser.id,
        email: dbUser.email,
        displayName: dto.displayName || dbUser.displayName,
        username, // Auto-generated for OAuth users
        avatarUrl: dto.avatarUrl !== undefined ? dto.avatarUrl : dbUser.avatarUrl,
        bio: dto.bio,
        visibility: dto.visibility ?? UserVisibility.PUBLIC, // Default to PUBLIC
        shareEvaluationsPublicly: dto.shareEvaluationsPublicly ?? true,
        role: mapRole(dbUser.role),
      },
    });

    return this.mapUserToDto(user);
  }

  /**
   * Generate unique username from base text
   * Checks database for existing usernames to avoid collisions
   */
  private async generateUsername(baseText: string): Promise<string> {
    const baseSlug = slugify(baseText) || usernameFromEmail(baseText);

    // Get all existing usernames that start with the base
    const existingUsers = await this.prismaService.user.findMany({
      where: {
        username: {
          startsWith: baseSlug.substring(0, Math.min(baseSlug.length, 20)),
        },
      },
      select: { username: true },
    });

    const existingUsernames = existingUsers.map((u) => u.username);

    return generateUniqueUsername(baseText, existingUsernames, 'user');
  }

  /**
   * Map Prisma User to UserDto
   */
  private mapUserToDto(user: User): UserDto {
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      username: user.username,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      visibility: user.visibility as unknown as UserDto['visibility'],
      shareEvaluationsPublicly: user.shareEvaluationsPublicly,
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
      username: user.username,
      avatarUrl: user.avatarUrl,
      bio: user.bio ?? null,
      visibility: user.visibility ?? UserVisibility.PUBLIC,
      shareEvaluationsPublicly: user.shareEvaluationsPublicly ?? true,
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
  private async buildAuthResponse(
    user: User,
    session: Session,
    plan?: UserPlanDto
  ): Promise<AuthResponseDto> {
    const userDto = this.mapUserToDto(user);

    // If plan not provided, fetch it (for signIn case)
    if (!plan) {
      plan = await this.planService.getOrCreatePlan(user.id);
    }

    userDto.plan = plan;

    return {
      user: userDto,
      session,
    };
  }
}