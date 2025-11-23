import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {
    super({
      // 1. Diz ao Passport para extrair o token do cabeçalho "Authorization"
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false, // Rejeita tokens expirados (importante!)
      
      // 2. Usa o MESMO segredo que definimos no 'auth.module.ts'
      // ⚠️ IMPORTANTE: Mude isto para uma variável de ambiente!
      secretOrKey: 'O_MEU_SEGREDO_SUPER_SECRETO_PARA_DEV_12345',
    });
  }

  /**
   * Esta função é chamada pelo Passport DEPOIS de validar o token.
   * O 'payload' é o conteúdo descodificado do JWT (o 'sub', 'email', 'role').
   */
  async validate(payload: { sub: string; email: string; role: string }): Promise<User> {
    // 3. Vamos à base de dados para garantir que o utilizador ainda existe
    const user = await this.usersRepository.findOneBy({ id: payload.sub });

    if (!user) {
      throw new UnauthorizedException('Utilizador não encontrado.');
    }
    
    // 4. O NestJS vai injetar este objeto 'user' no 'request' (request.user)
    // O 'AdminGuard' vai usar isto.
    return user;
  }
}