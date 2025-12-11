import { Controller, Get, Query, Logger, HttpException, HttpStatus, Post } from '@nestjs/common';
import { AiOptimizerService } from './ai-optimizer.service';

@Controller('optimizer')
export class AiOptimizerController {
  private readonly logger = new Logger(AiOptimizerController.name);

  constructor(private readonly optimizerService: AiOptimizerService) {}

  @Post('start')
  async startOptimization(
    @Query('symbol') symbol: string = 'BTCUSDT',
    @Query('attempts') attempts: string = '10',
  ) {
    const maxAttempts = parseInt(attempts, 10);
    
    // Chamamos o novo método de Mineração
    const champion = await this.optimizerService.mineStrategy(symbol, maxAttempts);

    if (champion) {
      // NestJS envia 200 OK por defeito quando retornas um objeto
      return {
        message: `Mineração concluída! Encontrado novo campeão para ${symbol}.`,
        roi: champion.stats.roi.toFixed(2),
        gene: champion.gene,
      };
    } else {
      // Para enviar um código diferente (ex: 202), lançamos uma exceção ou usamos @HttpCode
      // Aqui, retornar um objeto simples com uma mensagem também serve
      throw new HttpException({
        status: HttpStatus.ACCEPTED,
        message: `Mineração falhou após ${maxAttempts} tentativas. Nenhuma estratégia passou nos critérios WFA.`,
      }, HttpStatus.ACCEPTED);
    }
  }
}