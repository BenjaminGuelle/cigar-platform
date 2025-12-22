import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { Role, UserModel } from '@cigar-platform/types';
import type { Session } from '@supabase/supabase-js';

/**
 * User data returned in authentication responses
 * Implements UserModel to ensure consistency with frontend
 */
export class UserDto implements UserModel {
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
  @ApiProperty({ example: 'https://example.com/avatar.jpg', nullable: true })
  avatarUrl: string | null;

  @Expose()
  @ApiProperty({ enum: Role, example: Role.USER })
  role: Role;

  @Expose()
  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;
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
  })
  session: Session;
}