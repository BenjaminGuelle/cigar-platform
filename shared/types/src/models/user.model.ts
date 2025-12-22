import { Role } from '../enums';

/**
 * User model - represents a user in the system
 * Mirrors the Prisma User model and backend UserDto
 * @see prisma/schema.prisma
 */
export interface UserModel {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  role: Role;
  createdAt: Date;
}
