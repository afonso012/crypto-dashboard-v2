import { IsEmail, IsString, Length, IsOptional } from 'class-validator';

export class SendOtpDto {
  @IsEmail()
  email: string;

  @IsOptional() // Torna opcional para não dar erro 400 se faltar
  @IsString()
  type?: string;
}

export class VerifyOtpDto {
  @IsEmail()
  email: string;

  @IsString()
  @Length(6, 6)
  code: string;

  @IsOptional()
  @IsString()
  type?: string;
    
  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;
}