import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import configuration from './configuration';

describe('Configuration', () => {
  // Save original environment
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Clear environment variables before each test
    process.env = {};

    // Set NODE_ENV to test for the first test
    process.env.NODE_ENV = 'test';
  });

  afterEach(() => {
    // Restore original environment after each test
    process.env = { ...originalEnv };
  });

  it('should return default values when no env variables are set', () => {
    const config = configuration();

    expect(config.port).toBe(3000);
    expect(config.environment).toBe('test');
    expect(config.aws.region).toBe('us-east-1'); // Default value in configuration.ts
    expect(config.aws.cognito.userPoolId).toBeUndefined();
    expect(config.aws.cognito.clientId).toBeUndefined();
  });

  it('should use environment variables when provided', () => {
    process.env.PORT = '4000';
    process.env.NODE_ENV = 'production';
    process.env.AWS_REGION = 'us-west-2';
    process.env.AWS_COGNITO_USER_POOL_ID = 'test-pool-id';
    process.env.AWS_COGNITO_CLIENT_ID = 'test-client-id';

    const config = configuration();

    expect(config.port).toBe(4000);
    expect(config.environment).toBe('production');
    expect(config.aws.region).toBe('us-west-2');
    expect(config.aws.cognito.userPoolId).toBe('test-pool-id');
    expect(config.aws.cognito.clientId).toBe('test-client-id');

    // Clean up
    delete process.env.PORT;
    delete process.env.NODE_ENV;
    delete process.env.AWS_REGION;
    delete process.env.AWS_COGNITO_USER_POOL_ID;
    delete process.env.AWS_COGNITO_CLIENT_ID;
  });
});
