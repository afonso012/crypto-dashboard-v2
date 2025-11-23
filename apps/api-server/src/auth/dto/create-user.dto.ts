// Ficheiro: apps/api-server/src/auth/dto/create-user.dto.ts

import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional } from 'class-validator';
// (Não importamos o UserRole)

export class CreateUserDto {
  
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'A password deve ter pelo menos 8 caracteres' })
  password: string;

  // Aceita 'role' como uma string opcional
  @IsString()
  @IsOptional()
  role?: string;
}