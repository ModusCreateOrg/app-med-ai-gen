import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecsPatterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import { Construct } from 'constructs';

interface BackendStackProps extends cdk.StackProps {
  environment: 'staging' | 'production';
}

export class BackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: BackendStackProps) {
    super(scope, id, props);

    const isProd = props.environment === 'production';

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
  }
}
