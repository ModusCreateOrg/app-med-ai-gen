#!/usr/bin/env node
const { APIGateway, CloudFormation } = require('aws-sdk');
const fs = require('fs');
const path = require('path');

// Configuration - update these values
const STACK_NAME = 'ai-team-medical-reports-stack-development';
const REGION = 'us-east-1'; // Update with your region
const API_NAME = 'AIMedicalReport-development'; // Your API Gateway name

async function main() {
  try {
    console.log('Starting API Gateway policy update script...');

    // Initialize AWS clients
    const cloudformation = new CloudFormation({ region: REGION });
    const apigateway = new APIGateway({ region: REGION });

    // Get the stack outputs to find resources
    console.log(`Getting information from CloudFormation stack: ${STACK_NAME}`);
    const stackResponse = await cloudformation.describeStacks({
      StackName: STACK_NAME
    }).promise();

    if (!stackResponse.Stacks || stackResponse.Stacks.length === 0) {
      throw new Error(`Stack ${STACK_NAME} not found`);
    }

    // Find the API Gateway and Cognito User Pool ID from stack outputs
    const outputs = stackResponse.Stacks[0].Outputs || [];
    let cognitoUserPoolId = null;

    for (const output of outputs) {
      if (output.OutputKey === 'UserPoolId') {
        cognitoUserPoolId = output.OutputValue;
        console.log(`Found Cognito User Pool ID: ${cognitoUserPoolId}`);
      }
    }

    // If Cognito ID wasn't found in outputs, prompt for it
    if (!cognitoUserPoolId) {
      cognitoUserPoolId = process.env.COGNITO_USER_POOL_ID;
      if (!cognitoUserPoolId) {
        console.log('Cognito User Pool ID not found in stack outputs.');
        console.log('Please set the COGNITO_USER_POOL_ID environment variable and try again.');
        process.exit(1);
      }
    }

    // Find the API Gateway
    console.log('Listing API Gateways...');
    const apis = await apigateway.getRestApis().promise();

    const api = apis.items.find(api => api.name === API_NAME);
    if (!api) {
      throw new Error(`API Gateway with name ${API_NAME} not found`);
    }

    console.log(`Found API Gateway: ${api.name} (${api.id})`);

    // Create the resource policy
    const policy = {
      Version: '2012-10-17',
      Statement: [
        // Allow authenticated Cognito users
        {
          Effect: 'Allow',
          Principal: '*',
          Action: 'execute-api:Invoke',
          Resource: `arn:aws:execute-api:${REGION}:*:${api.id}/*/*`,
          Condition: {
            StringEquals: {
              'cognito-identity.amazonaws.com:aud': cognitoUserPoolId
            }
          }
        },
        // Deny non-HTTPS requests
        {
          Effect: 'Deny',
          Principal: '*',
          Action: 'execute-api:Invoke',
          Resource: `arn:aws:execute-api:${REGION}:*:${api.id}/*/*`,
          Condition: {
            Bool: {
              'aws:SecureTransport': 'false'
            }
          }
        }
      ]
    };

    console.log('Updating API Gateway policy...');
    console.log(JSON.stringify(policy, null, 2));

    // Update the API with the new policy
    await apigateway.updateRestApi({
      restApiId: api.id,
      patchOperations: [
        {
          op: 'replace',
          path: '/policy',
          value: JSON.stringify(policy)
        }
      ]
    }).promise();

    console.log('API Gateway policy updated successfully!');

  } catch (error) {
    console.error('Error updating API policy:', error);
    process.exit(1);
  }
}

main();
