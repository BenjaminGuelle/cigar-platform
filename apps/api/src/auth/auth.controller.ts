import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Patch,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import {
  SignUpDto,
  SignInDto,
  AuthResponseDto,
  UserDto,
} from './dto';
import { UpdateProfileDto } from '../users/dto/update-profile.dto';
import { RequestUser } from './types/request-user.type';

/**
 * Controller handling authentication endpoints
 * Follows RESTful conventions and modern NestJS practices
 */
@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Sign up a new user
   * POST /api/auth/signup
   */
  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Sign up a new user' })
  @ApiBody({ type: SignUpDto })
  @ApiResponse({
    status: 201,
    description: 'User successfully created',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 409, description: 'User already exists' })
  async signUp(@Body() dto: SignUpDto): Promise<AuthResponseDto> {
    return this.authService.signUp(dto);
  }

  /**
   * Sign in an existing user
   * POST /api/auth/signin
   */
  @Post('signin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sign in an existing user' })
  @ApiBody({ type: SignInDto })
  @ApiResponse({
    status: 200,
    description: 'User successfully authenticated',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async signIn(@Body() dto: SignInDto): Promise<AuthResponseDto> {
    return this.authService.signIn(dto);
  }

  /**
   * Sign out the current user
   * POST /api/auth/signout
   */
  @Post('signout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Sign out the current user' })
  @ApiResponse({ status: 204, description: 'User successfully signed out' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async signOut(@CurrentUser() user: RequestUser): Promise<void> {
    return this.authService.signOut(user.id);
  }

  /**
   * Get current user profile
   * GET /api/auth/profile
   *
   * ARCHITECTURE: Prisma is the source of truth
   * - OAuth (Google): Provides initial data on first login (onboarding)
   * - Prisma: Stores user's custom bio/avatar/displayName (source of truth)
   * - JWT virtual dbUser: Used to auto-create user on first access
   *
   * Always fetches fresh data from Prisma to respect user's custom changes
   * Auto-creates user in DB if doesn't exist (for OAuth users with custom claims)
   */
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    type: UserDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@CurrentUser() user: RequestUser): Promise<UserDto> {
    // ✅ Fetch fresh data from Prisma (source of truth)
    // ✅ Pass dbUser to allow auto-creation if doesn't exist (OAuth with custom claims)
    return this.authService.getProfile(user.id, user.authProvider, user.dbUser);
  }

  /**
   * Update current user profile
   * PATCH /api/auth/profile
   *
   * Auto-creates user in DB if doesn't exist (for OAuth users with custom claims)
   */
  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiBody({ type: UpdateProfileDto })
  @ApiResponse({
    status: 200,
    description: 'User profile updated successfully',
    type: UserDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateProfile(
    @CurrentUser() user: RequestUser,
    @Body() dto: UpdateProfileDto
  ): Promise<UserDto> {
    // Pass full dbUser to ensure user exists in DB (upsert)
    return this.authService.updateProfile(user.dbUser, dto);
  }
}