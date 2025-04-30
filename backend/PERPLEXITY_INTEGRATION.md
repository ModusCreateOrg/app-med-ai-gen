# Perplexity API Integration

This document describes the integration of the Perplexity API in the Medical Reports Explainer backend.

## Overview

The integration enables the backend to leverage Perplexity's AI capabilities to:

1. Explain medical text in simpler terms
2. Support custom chat completions for more flexible AI interactions

## Components

The integration consists of the following components:

1. **AWS Secrets Service**: Securely retrieves the Perplexity API key from AWS Secrets Manager
2. **Perplexity Service**: Interacts with the Perplexity API
3. **Perplexity Controller**: Exposes endpoints for the frontend to access the Perplexity functionality

## Implementation Details

### Configuration

The configuration for the Perplexity API is defined in `src/config/configuration.ts`:

```typescript
export default () => ({
  // ... existing config
  aws: {
    // ... existing aws config
    secretsManager: {
      perplexityApiKeySecret: process.env.PERPLEXITY_API_KEY_SECRET_NAME || 'med-ai-perplexity-key',
    },
  },
  perplexity: {
    apiBaseUrl: 'https://api.perplexity.ai',
    model: process.env.PERPLEXITY_MODEL || 'mixtral-8x7b-instruct',
    maxTokens: parseInt(process.env.PERPLEXITY_MAX_TOKENS || '2048', 10),
  },
});
```

### API Key Management

The API key is securely managed using AWS Secrets Manager:

1. The API key is stored in AWS Secrets Manager (not in the codebase)
2. The application retrieves the key at runtime using the AWS SDK
3. The key is cached for 15 minutes to minimize API calls to Secrets Manager

## Setup Instructions

### AWS Secrets Manager Setup

1. Create a secret in AWS Secrets Manager:

   ```
   aws secretsmanager create-secret \
     --name med-ai-perplexity-key \
     --description "Perplexity API Key for Medical Reports Explainer" \
     --secret-string "your-perplexity-api-key"
   ```

2. Ensure the IAM role used by the application has permissions to access the secret:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": ["secretsmanager:GetSecretValue"],
         "Resource": "arn:aws:secretsmanager:region:account-id:secret:med-ai-perplexity-key-*"
       }
     ]
   }
   ```

### Environment Variables

Configure the following environment variables:

| Variable                         | Description                               | Default Value           |
| -------------------------------- | ----------------------------------------- | ----------------------- |
| `PERPLEXITY_API_KEY_SECRET_NAME` | Name of the secret in AWS Secrets Manager | `med-ai-perplexity-key` |
| `PERPLEXITY_MODEL`               | Perplexity model to use                   | `mixtral-8x7b-instruct` |
| `PERPLEXITY_MAX_TOKENS`          | Maximum tokens to generate                | `2048`                  |
| `AWS_REGION`                     | AWS region for Secrets Manager            | `us-east-1`             |

## Local Development

For local development, you can set the API key directly as an environment variable:

```bash
export PERPLEXITY_API_KEY="your-api-key"
```

Then modify the `getApiKey` method in `PerplexityService` to check for this environment variable before trying to access AWS Secrets Manager.

## Frontend Integration

The frontend can interact with the Perplexity API through the following endpoints:

### Custom Chat Completion

```typescript
// Example frontend code
const createChatCompletion = async (messages: any[]) => {
  const response = await axios.post('/api/perplexity/chat/completions', {
    messages: messages,
    temperature: 0.7,
  });
  return response.data.explanation;
};
```
