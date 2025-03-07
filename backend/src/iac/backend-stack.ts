import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecsPatterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class BackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
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
        image: ecs.ContainerImage.fromAsset('../backend'),
        containerPort: 3000,
        environment: {
          NODE_ENV: 'production',
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
  }
}
