export default () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  environment: process.env.NODE_ENV || 'development',
  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    s3: {
      uploadBucket: process.env.S3_UPLOAD_BUCKET || '',
    },
    cognito: {
      userPoolId: process.env.AWS_COGNITO_USER_POOL_ID,
      clientId: process.env.AWS_COGNITO_CLIENT_ID,
    },
    secretsManager: {
      perplexityApiKeySecret:
        process.env.PERPLEXITY_API_KEY_SECRET_NAME ||
        'medical-reports-explainer/perplexity-api-key',
    },
    aws: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      sessionToken: process.env.AWS_SESSION_TOKEN,
    },
    bedrock: {
      model: process.env.AWS_BEDROCK_MODEL || 'us.anthropic.claude-3-7-sonnet-20250219-v1:0',
      maxTokens: parseInt(process.env.AWS_BEDROCK_MAX_TOKENS || '2048', 10),
      inferenceProfileArn:
        process.env.AWS_BEDROCK_INFERENCE_PROFILE_ARN ||
        'arn:aws:bedrock:us-east-1:841162674562:inference-profile/us.anthropic.claude-3-7-sonnet-20250219-v1:0',
      requestsPerMinute: parseInt(process.env.AWS_BEDROCK_REQUESTS_PER_MINUTE || '20', 20),
    },
    textract: {
      maxBatchSize: parseInt(process.env.AWS_TEXTRACT_MAX_BATCH_SIZE || '10', 10),
      documentRequestsPerMinute: parseInt(process.env.AWS_TEXTRACT_DOCS_PER_MINUTE || '20', 20),
    },
  },
  perplexity: {
    apiBaseUrl: 'https://api.perplexity.ai',
    model: process.env.PERPLEXITY_MODEL || 'sonar',
    maxTokens: parseInt(process.env.PERPLEXITY_MAX_TOKENS || '2048', 10),
  },
  dynamodbReportsTable:
    process.env.DYNAMODB_REPORTS_TABLE || 'AIMedicalReportReportsTabledevelopment',
});
