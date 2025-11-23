import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', unique: true })
  email: string;

  // << 🔥 NOVAS COLUNAS 🔥 >>
  @Column({ type: 'text', nullable: true }) // Opcional ou Obrigatório conforme preferir
  username: string;

  @Column({ type: 'text', nullable: true })
  phoneNumber: string;

  @Column({ type: 'text', select: false }) 
  password: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @CreateDateColumn()
  createdAt: Date;
}