import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { UserRole } from '../entities/user.entity';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user; // <-- Isto agora é preenchido pela JwtStrategy
    
    // Se o utilizador existir E o 'role' for 'admin', permite o acesso
    return user && user.role === UserRole.ADMIN;
  }
}