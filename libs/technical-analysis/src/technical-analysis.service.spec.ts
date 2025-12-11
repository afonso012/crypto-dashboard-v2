import { Test, TestingModule } from '@nestjs/testing';
import { TechnicalAnalysisService } from './technical-analysis.service';

describe('TechnicalAnalysisService', () => {
  let service: TechnicalAnalysisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TechnicalAnalysisService],
    }).compile();

    service = module.get<TechnicalAnalysisService>(TechnicalAnalysisService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
