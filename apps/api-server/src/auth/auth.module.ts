import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
// << 🔥 1. IMPORTAR A NOVA ESTRATÉGIA 🔥 >>
import { JwtStrategy } from './jwt.strategy';
import { OtpCode } from '../entities/otp-code.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, OtpCode]),
    // << 🔥 2. CONFIGURAR O PASSPORT PARA USAR 'jwt' COMO DEFAULT 🔥 >>
    PassportModule.register({ defaultStrategy: 'jwt' }),
    
    JwtModule.register({
      secret: 'O_MEU_SEGREDO_SUPER_SECRETO_PARA_DEV_12345', 
      signOptions: { expiresIn: '1d' },
    }),
  ],
  // << 🔥 3. ADICIONAR 'JwtStrategy' AOS PROVIDERS 🔥 >>
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
  // << 🔥 4. EXPORTAR O PASSPORT PARA OUTROS MÓDULOS (como o AdminModule) 🔥 >>
  exports: [PassportModule, JwtStrategy],
})
export class AuthModule {}