import { ApiProperty } from '@nestjs/swagger';

/**
 * User data returned in authentication responses
 */
export class UserDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: 'John Doe' })
  displayName: string;

  @ApiProperty({ example: 'https://example.com/avatar.jpg', nullable: true })
  avatarUrl: string | null;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;
}

/**
 * Session data returned in authentication responses
 */
export class SessionDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  accessToken: string;

  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  refreshToken: string;

  @ApiProperty({ example: 3600 })
  expiresIn: number;

  @ApiProperty({ example: 1704067200 })
  expiresAt: number;
}

/**
 * Complete authentication response
 */
export class AuthResponseDto {
  @ApiProperty({ type: UserDto })
  user: UserDto;

  @ApiProperty({ type: SessionDto })
  session: SessionDto;
}