import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { describe, it, expect, beforeEach } from 'vitest';

describe('UserController', () => {
  let controller: UserController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [],
    }).compile();

    controller = module.get<UserController>(UserController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
