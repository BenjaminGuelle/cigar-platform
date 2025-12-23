import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import type { User } from '@cigar-platform/prisma-client';
import { Role } from '@cigar-platform/prisma-client';
import type { AuthProvider } from '@cigar-platform/types';
import type { Session } from '@supabase/supabase-js';

/**
 * User data returned in authentication responses
 * Implements Prisma User type to ensure consistency with database and frontend
 */
export class UserDto implements User {
  @Expose()
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @Expose()
  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @Expose()
  @ApiProperty({ example: 'John Doe' })
  displayName: string;

  @Expose()
  @ApiPropertyOptional({
    type: String,
    example: 'https://example.com/avatar.jpg',
  })
  avatarUrl: string | null;

  @Expose()
  @ApiProperty({ enum: Role, example: Role.USER })
  role: Role;

  @Expose()
  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;

  @Expose()
  @ApiProperty({
    enum: ['google', 'apple', 'email'],
    example: 'email',
    required: false,
    description: 'Authentication provider (from Supabase metadata)',
  })
  authProvider?: AuthProvider;
}

/**
 * Complete authentication response
 */
export class AuthResponseDto {
  @Expose()
  @ApiProperty({ type: UserDto })
  user: UserDto;

  @Expose()
  @ApiProperty({
    description: 'Supabase session with access token, refresh token, and expiry info',
    example: {
      access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      refresh_token: 'v1.refresh_token...',
      expires_in: 3600,
      token_type: 'bearer',
      user: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'user@example.com'
      }
    }
  })
  session: Session;
}