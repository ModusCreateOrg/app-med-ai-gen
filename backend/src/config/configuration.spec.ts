import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import configuration from './configuration';

describe('Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    // Clear specific env variables we want to test
    delete process.env.PORT;
    delete process.env.NODE_ENV;
    delete process.env.AWS_REGION;
    delete process.env.AWS_COGNITO_USER_POOL_ID;
    delete process.env.AWS_COGNITO_CLIENT_ID;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should return default values when no env variables are set', () => {
    const config = configuration();

    expect(config.port).toBe(3000);
    expect(config.environment).toBe('development');
    expect(config.aws.region).toBe('us-east-1');
    expect(config.aws.cognito.userPoolId).toBe('us-east-1_example');
    expect(config.aws.cognito.clientId).toBe('example');
  });

  it('should use environment variables when set', () => {
    process.env.PORT = '4000';
    process.env.NODE_ENV = 'production';
    process.env.AWS_REGION = 'eu-west-1';
    process.env.AWS_COGNITO_USER_POOL_ID = 'test-pool-id';
    process.env.AWS_COGNITO_CLIENT_ID = 'test-client-id';

    const config = configuration();

    expect(config.port).toBe(4000);
    expect(config.environment).toBe('production');
    expect(config.aws.region).toBe('eu-west-1');
    expect(config.aws.cognito.userPoolId).toBe('test-pool-id');
    expect(config.aws.cognito.clientId).toBe('test-client-id');
  });
});
