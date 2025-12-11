import { NestFactory } from '@nestjs/core';
import { AiOptimizerModule } from './ai-optimizer.module';

async function bootstrap() {
  const app = await NestFactory.create(AiOptimizerModule);
  await app.listen(process.env.port ?? 3003);
}
bootstrap();
