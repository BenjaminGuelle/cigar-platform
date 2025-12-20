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
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import {
  SignUpDto,
  SignInDto,
  UpdateProfileDto,
  AuthResponseDto,
  UserDto,
} from '../../../../shared/types/src/dto/auth';

/**
 * Controller handling authentication endpoints
 * Follows RESTful conventions and modern NestJS practices
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Sign up a new user
   * POST /api/auth/signup
   */
  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  async signUp(@Body() dto: SignUpDto): Promise<AuthResponseDto> {
    return this.authService.signUp(dto);
  }

  /**
   * Sign in an existing user
   * POST /api/auth/signin
   */
  @Post('signin')
  @HttpCode(HttpStatus.OK)
  async signIn(@Body() dto: SignInDto): Promise<AuthResponseDto> {
    return this.authService.signIn(dto);
  }

  /**
   * Sign out the current user
   * POST /api/auth/signout
   */
  @Post('signout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async signOut(@CurrentUser() user: any): Promise<void> {
    return this.authService.signOut(user.id);
  }

  /**
   * Get current user profile
   * GET /api/auth/profile
   */
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@CurrentUser() user: any): Promise<UserDto> {
    return this.authService.getProfile(user.id);
  }

  /**
   * Update current user profile
   * PATCH /api/auth/profile
   */
  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @CurrentUser() user: any,
    @Body() dto: UpdateProfileDto
  ): Promise<UserDto> {
    return this.authService.updateProfile(user.id, dto);
  }
}