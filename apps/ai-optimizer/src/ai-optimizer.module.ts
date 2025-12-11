import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AiOptimizerController } from './ai-optimizer.controller';
import { AiOptimizerService } from './ai-optimizer.service';

@Module({
  imports: [HttpModule], // Permite fazer pedidos HTTP
  controllers: [AiOptimizerController],
  providers: [AiOptimizerService],
})
export class AiOptimizerModule {}