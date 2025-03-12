import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecsPatterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';

interface BackendStackProps extends cdk.StackProps {
  environment: 'staging' | 'production';
}

export class BackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: BackendStackProps) {
    super(scope, id, props);

    // DynamoDB Table
    const reportsTable = new dynamodb.Table(this, 'ReportsTable', {
      tableName: 'reports',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.RETAIN,
      timeToLiveAttribute: 'ttl', // Optional: if you want to add TTL
    });

    // Cognito User Pool
    const userPool = new cognito.UserPool(this, 'AICognitoMedicalReportsUserPool', {
      userPoolName: 'ai-cognito-medical-reports-user-pool',
      selfSignUpEnabled: true,
      autoVerify: { email: true },
      standardAttributes: {
        email: { required: true, mutable: true },
        givenName: { required: true, mutable: true },
        familyName: { required: true, mutable: true },
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false,
      },
      removalPolicy: RemovalPolicy.RETAIN,
    });

    // User Pool Client
    const userPoolClient = new cognito.UserPoolClient(this, 'AICognitoMedicalReportsUserPoolClient', {
      userPool,
      authFlows: {
        userPassword: true,
        userSrp: true,
      },
      generateSecret: false,
    });

    // VPC
    const vpc = new ec2.Vpc(this, 'MedicalReportsVPC', {
      maxAzs: 2,
    });

    // ECS Cluster
    const cluster = new ecs.Cluster(this, 'MedicalReportsCluster', {
      vpc,
      containerInsights: true,
    });

    // Fargate Service
    const fargateService = new ecsPatterns.ApplicationLoadBalancedFargateService(this, 'MedicalReportsService', {
      cluster,
      memoryLimitMiB: 512,
      cpu: 256,
      desiredCount: 2,
      taskImageOptions: {
        image: ecs.ContainerImage.fromAsset('../backend/', {
          file: 'Dockerfile.prod',
          buildArgs: {
            NODE_ENV: props.environment,
          },
        }),
        containerPort: 3000,
        environment: {
          NODE_ENV: props.environment,
          PERPLEXITY_API_KEY_SECRET_NAME: `medical-reports-explainer/${props.environment}/perplexity-api-key`,
          PERPLEXITY_MODEL: 'sonar',
          PERPLEXITY_MAX_TOKENS: '2048',
        },
      },
    });

    // Add DynamoDB permissions to ECS Task Role
    reportsTable.grantReadWriteData(fargateService.taskDefinition.taskRole);

    // API Gateway
    const api = new apigateway.RestApi(this, 'MedicalReportsApi', {
      restApiName: 'Medical Reports API',
      description: 'API Gateway for Medical Reports Backend',
    });

    // Integration
    const integration = new apigateway.HttpIntegration(
      `http://${fargateService.loadBalancer.loadBalancerDnsName}/{proxy}`,
      {
        proxy: true,
        options: {
          requestParameters: {
            'integration.request.path.proxy': 'context.path',
          },
        },
      }
    );

    // Proxy all requests to Fargate
    api.root.addProxy({
      defaultIntegration: integration,
      anyMethod: true,
      defaultMethodOptions: {
        requestParameters: {
          'method.request.path.proxy': true,
        },
      },
    });

    // Outputs
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'API Gateway URL',
    });

    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: fargateService.loadBalancer.loadBalancerDnsName,
      description: 'Load Balancer DNS',
    });

    new cdk.CfnOutput(this, 'ReportsTableName', {
      value: reportsTable.tableName,
      description: 'DynamoDB Reports Table Name',
      exportName: 'ReportsTableName',
    });

    // Cognito Outputs
    new cdk.CfnOutput(this, 'UserPoolId', {
      value: userPool.userPoolId,
      description: 'Cognito User Pool ID',
      exportName: 'UserPoolId',
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: userPoolClient.userPoolClientId,
      description: 'Cognito User Pool Client ID',
      exportName: 'UserPoolClientId',
    });
  }
}
