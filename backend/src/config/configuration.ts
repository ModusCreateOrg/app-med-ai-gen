export default () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  environment: process.env.NODE_ENV || 'development',
  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    cognito: {
      userPoolId: process.env.AWS_COGNITO_USER_POOL_ID || 'us-east-1_example',
      clientId: process.env.AWS_COGNITO_CLIENT_ID || 'example',
      region: process.env.AWS_COGNITO_REGION || 'us-east-1',
    },
    secretsManager: {
      perplexityApiKeySecret: process.env.PERPLEXITY_API_KEY_SECRET_NAME || 'medical-reports-explainer/perplexity-api-key',
    },
  },
  perplexity: {
    apiBaseUrl: 'https://api.perplexity.ai',
    model: process.env.PERPLEXITY_MODEL || 'sonar',
    maxTokens: parseInt(process.env.PERPLEXITY_MAX_TOKENS || '2048', 10),
  },
});
