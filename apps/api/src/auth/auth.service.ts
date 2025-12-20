import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from './supabase.service';
import { PrismaService } from '../app/prisma.service';
import {
  SignUpDto,
  SignInDto,
  UpdateProfileDto,
  AuthResponseDto,
  UserDto,
  SessionDto,
} from '../../../../shared/types/src/dto/auth';

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
      throw new ConflictException(error.message);
    }

    if (!data.user) {
      throw new ConflictException('Failed to create user account');
    }

    // Check if email confirmation is required (session is null when confirmation is needed)
    if (!data.session) {
      throw new ConflictException(
        'User created but email confirmation is required. Please check your email and confirm your account before signing in.'
      );
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
      throw new UnauthorizedException('Invalid credentials');
    }

    // Fetch user from database
    const user = await this.prismaService.user.findUnique({
      where: { id: data.user.id },
    });

    if (!user) {
      throw new NotFoundException('User not found in database');
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
  async getProfile(userId: string): Promise<UserDto> {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.mapUserToDto(user);
  }

  /**
   * Update user profile
   */
  async updateProfile(
    userId: string,
    dto: UpdateProfileDto
  ): Promise<UserDto> {
    const user = await this.prismaService.user.update({
      where: { id: userId },
      data: {
        ...(dto.displayName && { displayName: dto.displayName }),
        ...(dto.avatarUrl !== undefined && { avatarUrl: dto.avatarUrl }),
      },
    });

    return this.mapUserToDto(user);
  }

  /**
   * Map Prisma User to UserDto
   */
  private mapUserToDto(user: any): UserDto {
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
    };
  }

  /**
   * Build authentication response with user and session data
   */
  private buildAuthResponse(user: any, session: any): AuthResponseDto {
    const sessionDto: SessionDto = {
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
      expiresIn: session.expires_in,
      expiresAt: session.expires_at,
    };

    return {
      user: this.mapUserToDto(user),
      session: sessionDto,
    };
  }
}