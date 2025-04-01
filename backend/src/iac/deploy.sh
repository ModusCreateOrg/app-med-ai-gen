#!/bin/bash
# Run CDK deployment
cdk deploy ai-team-medical-reports-stack-development

# If successful, update the API policy
if [ $? -eq 0 ]; then
  ./update-api-policy.js
fi
