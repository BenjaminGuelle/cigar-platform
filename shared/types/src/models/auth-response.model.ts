import { UserModel } from './user.model';
import { Session } from '@supabase/supabase-js';

/**
 * Authentication response model
 * Matches backend AuthResponseDto
 * @see apps/api/src/auth/dto/auth-response.dto.ts
 */
export interface AuthResponseModel {
  user: UserModel;
  session: Session;
}
