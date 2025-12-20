import { Role } from './enums';

export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  role: Role;
  createdAt: Date;
}

export interface CreateUserDto {
  email: string;
  displayName: string;
  avatarUrl?: string;
}

export interface UpdateUserDto {
  displayName?: string;
  avatarUrl?: string;
}