// Ficheiro: apps/api-server/src/admin/admin.module.ts (CORRIGIDO)

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrackedSymbol } from '../entities/tracked-symbol.entity';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
// << 🔥 1. IMPORTAR O AuthModule 🔥 >>
import { AuthModule } from '../auth/auth.module';
import { User } from '../entities/user.entity';
import { Kline } from '../entities/kline.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([TrackedSymbol, User, Kline]),
    // << 🔥 2. ADICIONAR O AuthModule ÀS IMPORTAÇÕES 🔥 >>
    // Isto dá ao AdminModule acesso ao PassportModule e aos Guards
    AuthModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}