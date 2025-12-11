import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Strategy } from '../entities/strategy.entity';

@Injectable()
export class StrategiesService {
  constructor(
    @InjectRepository(Strategy)
    private strategyRepo: Repository<Strategy>,
  ) {}

  async saveStrategy(data: Partial<Strategy>) {
    const strategy = this.strategyRepo.create(data);
    return this.strategyRepo.save(strategy);
  }

  async getAllStrategies() {
    return this.strategyRepo.find({ order: { createdAt: 'DESC' } });
  }
}