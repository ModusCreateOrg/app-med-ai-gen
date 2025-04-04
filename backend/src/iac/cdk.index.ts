#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { BackendStack } from './backend-stack';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

export * from './backend-stack';

export function main() {
  const app = new cdk.App();

  console.log('NODE_ENV', process.env.NODE_ENV);

  const cognitoClientId = process.env.AWS_COGNITO_CLIENT_ID;
  const cognitoUserPoolId = process.env.AWS_COGNITO_USER_POOL_ID;

  if (!cognitoClientId || !cognitoUserPoolId) {
    throw new Error('AWS_COGNITO_CLIENT_ID and AWS_COGNITO_USER_POOL_ID must be set');
  }

  void new BackendStack(app, `ai-team-medical-reports-stack-${process.env.NODE_ENV}`, {
    environment: process.env.NODE_ENV || 'development',
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
    },
    cognitoClientId: cognitoClientId,
    cognitoUserPoolId: cognitoUserPoolId,
  });

  return app;
}

// If this file is run directly, create the stack
if (require.main === module) {
  main();
}
