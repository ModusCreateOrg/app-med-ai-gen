#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { BackendStack } from './backend-stack';

export * from './backend-stack';

// This function can be called to create the stack
export function main() {
  const app = new cdk.App();

  new BackendStack(app, 'ai-medical-reports-backend-stack', {
    environment: 'development',
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
    },
  });

  return app;
}

// If this file is run directly, create the stack
if (require.main === module) {
  main();
}
