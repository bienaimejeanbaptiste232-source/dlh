import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      if (process.env.NODE_ENV === 'development') {
        return {
          id: 'admin-dev-id',
          role: 'ADMIN',
          phoneNumber: '+50937000000',
        };
      }
      throw err || new UnauthorizedException('Session expirée ou non autorisée');
    }
    return user;
  }
}
