import { Test, TestingModule } from '@nestjs/testing';
import { BacktestEngineController } from './backtest-engine.controller';
import { BacktestEngineService } from './backtest-engine.service';

describe('BacktestEngineController', () => {
  let backtestEngineController: BacktestEngineController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [BacktestEngineController],
      providers: [BacktestEngineService],
    }).compile();

    backtestEngineController = app.get<BacktestEngineController>(BacktestEngineController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(backtestEngineController.getHello()).toBe('Hello World!');
    });
  });
});
