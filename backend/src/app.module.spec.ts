import { Test } from '@nestjs/testing';
import { AppModule } from './app.module';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './auth/jwt.strategy';
import { ReportsService } from './reports/reports.service';
import { vi, describe, it, expect } from 'vitest';

describe('AppModule', () => {
  it('should compile the module', async () => {
    const module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
        JwtModule.register({
          secret: 'test-secret',
          signOptions: { expiresIn: '1h' },
        }),
        AppModule,
      ],
    })
      .overrideProvider(JwtStrategy)
      .useValue({
        validate: vi.fn().mockImplementation(payload => payload),
      })
      .overrideProvider(ReportsService)
      .useValue({
        findAll: vi.fn().mockResolvedValue([]),
        findLatest: vi.fn().mockResolvedValue([]),
        findOne: vi.fn().mockResolvedValue({}),
        updateStatus: vi.fn().mockResolvedValue({}),
      })
      .compile();

    expect(module).toBeDefined();
  });
});
