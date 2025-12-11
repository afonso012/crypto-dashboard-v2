import { Controller, Post, Body, Logger } from '@nestjs/common';
import { BacktestEngineService } from './backtest-engine.service';
import { BacktestInputDto } from './dto/run-backtest.dto';

@Controller('backtest')
export class BacktestEngineController {
  private readonly logger = new Logger(BacktestEngineController.name);

  constructor(private readonly backtestService: BacktestEngineService) {}

  @Post('run')
  async run(@Body() body: any) {
    this.logger.log('📥 [BacktestEngine] Pedido recebido.');

    // Conversão segura do body para o DTO
    const input: BacktestInputDto = {
      symbol: body.symbol || 'BTCUSDT',
      startDate: new Date(body.startDate || '2024-01-01'),
      endDate: new Date(body.endDate || '2024-02-01'),
      initialCapital: body.initialCapital || 1000,
      // 🔥 Agora passamos a estratégia completa, não pesos soltos
      strategy: body.strategy 
    };

    return this.backtestService.runBacktest(input);
  }
}