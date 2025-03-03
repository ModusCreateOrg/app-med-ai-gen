import { describe, it, expect } from 'vitest';
import configuration from './configuration';

describe('Configuration', () => {
  it('should return default values when no env variables are set', () => {
    const config = configuration();
    
    expect(config.port).toBe(3000);
    expect(config.environment).toBe('development');
    expect(config.aws.region).toBeUndefined();
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