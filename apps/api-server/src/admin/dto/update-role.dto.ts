import { IsEnum, IsNotEmpty } from 'class-validator';
import { UserRole } from '../../entities/user.entity';

export class UpdateRoleDto {
  @IsEnum(UserRole) // Garante que o valor é 'admin' ou 'user'
  @IsNotEmpty()
  role: UserRole;
}