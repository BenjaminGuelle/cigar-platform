/**
 * User data returned in authentication responses
 */
export interface UserDto {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  createdAt: Date;
}

/**
 * Session data returned in authentication responses
 */
export interface SessionDto {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  expiresAt: number;
}

/**
 * Complete authentication response
 */
export interface AuthResponseDto {
  user: UserDto;
  session: SessionDto;
}