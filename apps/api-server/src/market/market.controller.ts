// Ficheiro: apps/api-server/src/market/market.controller.ts
import { Controller, Get, Param, Query } from '@nestjs/common';
import { MarketService } from './market.service';

@Controller('market') // Todos os URLs aqui começarão com /market
export class MarketController {
  constructor(private readonly marketService: MarketService) {}

  @Get('/active-symbols')
  getActiveSymbols() {
    return this.marketService.getActiveSymbols();
  }


  @Get('/history/:symbol')
  getHistory(
    @Param('symbol') symbol: string,
    @Query('startTime') startTime: string,
    @Query('endTime') endTime: string,
  ) {
    return this.marketService.getHistory(
      symbol,
      parseInt(startTime),
      parseInt(endTime),
    );
  }


}