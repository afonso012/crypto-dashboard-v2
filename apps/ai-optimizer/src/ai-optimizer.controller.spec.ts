import { Test, TestingModule } from '@nestjs/testing';
import { AiOptimizerController } from './ai-optimizer.controller';
import { AiOptimizerService } from './ai-optimizer.service';

describe('AiOptimizerController', () => {
  let aiOptimizerController: AiOptimizerController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AiOptimizerController],
      providers: [AiOptimizerService],
    }).compile();

    aiOptimizerController = app.get<AiOptimizerController>(AiOptimizerController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(aiOptimizerController.getHello()).toBe('Hello World!');
    });
  });
});
