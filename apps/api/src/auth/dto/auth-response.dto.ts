import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { Role } from '@cigar-platform/types';

/**
 * User data returned in authentication responses
 */
export class UserDto {
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
 * Session data returned in authentication responses
 */
export class SessionDto {
  @Expose()
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  accessToken: string;

  @Expose()
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  refreshToken: string;

  @Expose()
  @ApiProperty({ example: 3600 })
  expiresIn: number;

  @Expose()
  @ApiProperty({ example: 1704067200 })
  expiresAt: number;
}

/**
 * Complete authentication response
 */
export class AuthResponseDto {
  @Expose()
  @ApiProperty({ type: UserDto })
  user: UserDto;

  @Expose()
  @ApiProperty({ type: SessionDto })
  session: SessionDto;
}