import { Role } from '../enums';

export interface UserModel {
  id: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
  role: Role;
}
