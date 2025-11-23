// Ficheiro: apps/api-server/src/auth/auth.service.ts (CORRIGIDO)

import { Injectable, UnauthorizedException, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../entities/user.entity';
import { OtpCode } from '../entities/otp-code.entity';
import { JwtService } from '@nestjs/jwt';
import { Resend } from 'resend';
import * as crypto from 'crypto';
import { SendOtpDto, VerifyOtpDto } from './dto/auth-otp.dto';

// ⚠️ Substitua pela sua chave real do Resend
const RESEND_API_KEY = 're_HKrvUKe7_2iKY9qpBrpbgkfPjEz2wwdrr'; 

@Injectable()
export class AuthService {
  private resend = new Resend(RESEND_API_KEY);

  constructor(
    @InjectRepository(User) private usersRepository: Repository<User>,
    @InjectRepository(OtpCode) private otpRepository: Repository<OtpCode>,
    private jwtService: JwtService,
  ) {}

  // --- PASSO 1: ENVIAR O CÓDIGO ---
  async sendOtp(dto: SendOtpDto) {
    const { email } = dto;
    const type = dto.type || 'login';

    // 1. Verificar se o utilizador existe
    const userExists = await this.usersRepository.findOneBy({ email });

    // 2. Lógica de Segurança (Login vs Registo)
    if (type === 'login') {
      if (!userExists) {
        throw new NotFoundException('Não existe conta associada a este email.');
      }
    } else if (type === 'register') {
      if (userExists) {
        throw new ConflictException('Este email já tem uma conta. Faça login.');
      }
    }

    // 3. Gerar o Código
    const code = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5); // Expira em 5 minutos

    // 4. Guardar na BD
    await this.otpRepository.delete({ email });
    await this.otpRepository.save({ email, code, expiresAt });

    // 5. Enviar Email
    try {
      await this.resend.emails.send({
        from: 'login@optafund.com',
        to: email,
        subject: `Seu código de verificação OptaFund: ${code}`,
        html: `
          <div style="font-family: sans-serif; color: #333;">
            <h2>Olá!</h2>
            <p>Use o código abaixo para completar o seu ${type === 'login' ? 'login' : 'registo'} no OptaFund:</p>
            <h1 style="color: #4F46E5; font-size: 32px; letter-spacing: 2px;">${code}</h1>
            <p style="font-size: 12px; color: #666;">Este código expira em 5 minutos.</p>
          </div>
        `
      });
      
      console.log(`[DEV] Código enviado para ${email}: ${code}`);
      return { message: 'Código enviado com sucesso' };
      
    } catch (error) {
      console.error("Erro Resend:", error);
      console.log(`[DEV FALLBACK] O código é: ${code}`);
      // return { message: 'Código gerado (ver console)' }; // Descomente para evitar erro 500 se falhar email
      throw new BadRequestException('Falha ao enviar email');
    }
  }

  // --- PASSO 2: VERIFICAR E ENTRAR ---
  async verifyOtp(dto: VerifyOtpDto) {
    const { email, code, type, username, phoneNumber } = dto;

    // 1. Validar o código
    const otpRecord = await this.otpRepository.findOneBy({ email, code });

    if (!otpRecord) {
      throw new UnauthorizedException('Código incorreto.');
    }

    if (new Date() > otpRecord.expiresAt) {
      throw new UnauthorizedException('O código expirou. Peça um novo.');
    }

    // 2. Consumir o código
    await this.otpRepository.remove(otpRecord);

    // 3. Ação Final: Login ou Criação
    let user = await this.usersRepository.findOneBy({ email });

    if (type === 'register') {
      if (user) {
        throw new ConflictException('Utilizador já foi criado entretanto.');
      }
      
      // << 🔥 CORREÇÃO AQUI 🔥 >>
      // Removemos o "|| null". Se for undefined, o TypeORM ignora ou põe null.
      user = this.usersRepository.create({
        email,
        username: username || email.split('@')[0], 
        phoneNumber: phoneNumber, // <-- Agora aceita 'undefined' (opcional)
        role: UserRole.USER,
        password: crypto.randomUUID(),
      });
      await this.usersRepository.save(user);
    }

    if (!user) {
      throw new NotFoundException('Utilizador não encontrado.');
    }

    // 4. Gerar o Token
    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}