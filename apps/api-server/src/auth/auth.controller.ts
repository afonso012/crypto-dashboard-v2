import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SendOtpDto, VerifyOtpDto } from './dto/auth-otp.dto'; // Importe os DTOs

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('send-otp')
  async sendOtp(@Body() dto: SendOtpDto) {
    console.log(">>> PEDIDO RECEBIDO: send-otp", dto); // Log para confirmar que chegou
    return this.authService.sendOtp(dto);
  }

  @Post('verify-otp')
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    console.log(">>> PEDIDO RECEBIDO: verify-otp", dto);
    return this.authService.verifyOtp(dto);
  }
}