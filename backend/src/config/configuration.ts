export default () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  environment: process.env.NODE_ENV || 'development',
  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    cognito: {
      userPoolId: process.env.AWS_COGNITO_USER_POOL_ID,
      clientId: process.env.AWS_COGNITO_CLIENT_ID,
    },
    secretsManager: {
      perplexityApiKeySecret: process.env.PERPLEXITY_API_KEY_SECRET_NAME || 'medical-reports-explainer/perplexity-api-key',
    },
    aws: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
    bedrock: {
      model: process.env.AWS_BEDROCK_MODEL || 'anthropic.claude-3-7-sonnet-20250219-v1:0',
      maxTokens: parseInt(process.env.AWS_BEDROCK_MAX_TOKENS || '2048', 10),
    }
  },
  perplexity: {
    apiBaseUrl: 'https://api.perplexity.ai',
    model: process.env.PERPLEXITY_MODEL || 'sonar',
    maxTokens: parseInt(process.env.PERPLEXITY_MAX_TOKENS || '2048', 10),
  },
});
