# API Gateway Resource Policy Update Script

This script updates your API Gateway resource policy after your CDK deployment to allow only Cognito authenticated users and deny non-HTTPS requests. Using a separate script avoids the circular dependency issues that can occur when adding policies in CDK.

## Setup

1. Save the script to a file named `update-api-policy.js` in your project.

2. Install the AWS SDK if you haven't already:
   ```bash
   npm install aws-sdk
   ```

3. Make the script executable:
   ```bash
   chmod +x update-api-policy.js
   ```

## Configuration

Update the following variables in the script to match your environment:

- `STACK_NAME`: The name of your CloudFormation stack (e.g., 'ai-team-medical-reports-stack-development')
- `REGION`: Your AWS region (e.g., 'us-east-1')
- `API_NAME`: The name of your API Gateway (e.g., 'AIMedicalReport-development')

## Usage

You can run the script after each successful CDK deployment:

```bash
# Run CDK deployment first
cdk deploy ai-team-medical-reports-stack-development

# Then run the policy update script
./update-api-policy.js
```

Alternatively, you can set the Cognito User Pool ID as an environment variable:

```bash
COGNITO_USER_POOL_ID=us-east-1_yourPoolId ./update-api-policy.js
```

## Automation

To automatically run this after each deployment, you can create a simple shell script:

```bash
#!/bin/bash
# deploy-and-update.sh

# Deploy with CDK
cdk deploy ai-team-medical-reports-stack-development

# If deployment was successful, update the API policy
if [ $? -eq 0 ]; then
  echo "CDK deployment successful, updating API policy..."
  ./update-api-policy.js
else
  echo "CDK deployment failed, skipping API policy update."
  exit 1
fi
```

Make it executable:
```bash
chmod +x deploy-and-update.sh
```

## Troubleshooting

If you encounter any issues:

1. **Authentication errors**: Make sure your AWS credentials are configured correctly with the necessary permissions.

2. **API not found**: Verify the API_NAME matches exactly what's in your AWS Console.

3. **Stack not found**: Check that the STACK_NAME is correct.

4. **Cognito User Pool ID not found**: You can set it manually with the COGNITO_USER_POOL_ID environment variable.

## Security Considerations

This script sets a resource policy that:

1. Allows only authenticated Cognito users to access your API
2. Denies any non-HTTPS requests to your API

If you need more complex permissions, you can modify the policy object in the script.