import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

/**
 * Service for retrieving secrets from AWS Secrets Manager
 */
@Injectable()
export class AwsSecretsService {
  private readonly logger = new Logger(AwsSecretsService.name);
  private readonly client: SecretsManagerClient | null;
  private secretsCache: Map<string, { value: string; timestamp: number }> = new Map();
  private readonly CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes
  private readonly isTestEnv: boolean;

  constructor(private configService: ConfigService) {
    this.isTestEnv = process.env.NODE_ENV === 'test';

    // Skip AWS SDK initialization in test environment
    if (this.isTestEnv) {
      this.client = null;
    } else {
      const region = this.configService.get<string>('aws.region') || 'us-east-1';
      this.client = new SecretsManagerClient({ region });
    }
  }

  /**
   * Retrieves a secret from AWS Secrets Manager with caching
   *
   * @param secretName The name of the secret to retrieve
   * @returns The secret value
   */
  async getSecret(secretName: string): Promise<string> {
    try {
      // Check if we're in test mode
      if (this.isTestEnv) {
        return 'test-secret-value';
      }

      // Check cache first
      const cached = this.secretsCache.get(secretName);
      const now = Date.now();

      if (cached && now - cached.timestamp < this.CACHE_TTL_MS) {
        return cached.value;
      }

      // Retrieve from AWS if not cached or expired
      if (!this.client) {
        throw new Error('AWS SecretsManager client is not initialized');
      }

      const command = new GetSecretValueCommand({ SecretId: secretName });
      const response = await this.client.send(command);

      if (!response.SecretString) {
        throw new Error(`Secret ${secretName} does not contain a value`);
      }

      // Update cache
      let secretValue: string;
      try {
        // Try to parse as JSON first
        const secretJson = JSON.parse(response.SecretString);

        // If this is a simple key-value pair, extract the value
        // AWS Secrets typically store secrets in a JSON format like { "apiKey": "actual-value" }
        if (typeof secretJson === 'object' && secretJson !== null) {
          // For API keys, often there's a specific key we want like 'key' or 'apiKey'
          // Or just take the first value if it's a simple object
          if ('key' in secretJson) secretValue = String(secretJson.key);
          else if ('apiKey' in secretJson) secretValue = String(secretJson.apiKey);
          else secretValue = String(Object.values(secretJson)[0]);
        } else {
          // If it's not an object, just stringify whatever we got
          secretValue = String(secretJson);
        }
      } catch (e) {
        // If it's not valid JSON, just use the raw string
        secretValue = response.SecretString;
      }

      this.secretsCache.set(secretName, {
        value: secretValue,
        timestamp: now,
      });

      return secretValue;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to retrieve secret ${secretName}: ${errorMessage}`);
      throw error;
    }
  }
}
