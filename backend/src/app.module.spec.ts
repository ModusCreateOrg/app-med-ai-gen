import { Test } from '@nestjs/testing';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

describe('AppModule', () => {
  it('should compile the module', async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    expect(module).toBeDefined();
    const configService = module.get<ConfigService>(ConfigService);
    expect(configService).toBeDefined();
    expect(configService.get('port')).toBe(3000);
  });
}); 