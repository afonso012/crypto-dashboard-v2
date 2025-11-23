import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity({ name: 'otp_codes' })
export class OtpCode {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  email: string;

  @Column()
  code: string; // O código de 6 dígitos

  @Column()
  expiresAt: Date; // Quando o código deixa de ser válido (ex: 5 min)

  @CreateDateColumn()
  createdAt: Date;
}