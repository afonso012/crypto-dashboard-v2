import { Body, Controller, Get, Post } from '@nestjs/common';
import { StrategiesService } from './strategies.service';

@Controller('strategies')
export class StrategiesController {
  constructor(private readonly strategiesService: StrategiesService) {}

  @Post()
  async create(@Body() body: any) {
    return this.strategiesService.saveStrategy(body);
  }

  @Get()
  async findAll() {
    // 🔥 CORREÇÃO: Usar o nome correto 'getAllStrategies'
    return this.strategiesService.getAllStrategies(); 
  }
}