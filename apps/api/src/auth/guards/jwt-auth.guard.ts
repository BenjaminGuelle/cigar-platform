import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase.service';
import { InvalidTokenException } from '../../common/exceptions';

/**
 * Guard to protect routes with JWT authentication
 * Validates Supabase JWT tokens and attaches user to request
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private supabaseService: SupabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new InvalidTokenException('No authentication token provided');
    }

    const user = await this.supabaseService.verifyToken(token);

    if (!user) {
      throw new InvalidTokenException();
    }

    // Attach user to request for use in controllers
    request.user = user;
    return true;
  }

  private extractTokenFromHeader(request: any): string | null {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      return null;
    }

    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : null;
  }
}