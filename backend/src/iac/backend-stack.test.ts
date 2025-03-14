import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { BackendStack } from './backend-stack';

describe('BackendStack', () => {
  let app: cdk.App;
  let stackProps: cdk.StackProps;
  let stagingStack: BackendStack;
  let productionStack: BackendStack;
  let stagingTemplate: Template;
  let productionTemplate: Template;

  beforeEach(() => {
    app = new cdk.App();
    stackProps = {
      env: { account: '123456789012', region: 'us-east-1' },
    };

    // Create both staging and production stacks for testing
    stagingStack = new BackendStack(app, 'StagingStack', {
      ...stackProps,
      environment: 'staging',
    });
    stagingTemplate = Template.fromStack(stagingStack);

    productionStack = new BackendStack(app, 'ProductionStack', {
      ...stackProps,
      environment: 'production',
    });
    productionTemplate = Template.fromStack(productionStack);
  });

  describe('VPC Resources', () => {
    it('should create a VPC with the correct configuration', () => {
      // Test VPC in staging
      stagingTemplate.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
        Tags: Match.arrayWith([
          {
            Key: 'Name',
            Value: Match.stringLikeRegexp('AIMedicalReportVPC'),
          },
        ]),
      });

      // Verify subnet count for staging (2 AZs = 4 subnets)
      stagingTemplate.resourceCountIs('AWS::EC2::Subnet', 4);

      // Verify subnet count for production (3 AZs = 6 subnets)
      productionTemplate.resourceCountIs('AWS::EC2::Subnet', 6);
    });
  });

  describe('ECS Resources', () => {
    it('should create an ECS cluster with container insights', () => {
      stagingTemplate.hasResourceProperties('AWS::ECS::Cluster', {
        ClusterName: 'AIMedicalReportCluster',
        ClusterSettings: [
          {
            Name: 'containerInsights',
            Value: 'enabled',
          },
        ],
      });
    });

    it('should create a Fargate task definition with correct resources', () => {
      // Test staging task definition
      stagingTemplate.hasResourceProperties('AWS::ECS::TaskDefinition', {
        Cpu: '256',
        Memory: '512',
        NetworkMode: 'awsvpc',
        RequiresCompatibilities: ['FARGATE'],
        ContainerDefinitions: Match.arrayWith([
          Match.objectLike({
            Environment: Match.arrayWith([
              { Name: 'NODE_ENV', Value: 'staging' },
              { Name: 'PERPLEXITY_MODEL', Value: 'sonar' },
              { Name: 'PERPLEXITY_MAX_TOKENS', Value: '2048' },
            ]),
            LogConfiguration: Match.objectLike({
              LogDriver: 'awslogs',
            }),
            PortMappings: [
              {
                ContainerPort: 3000,
                Protocol: 'tcp',
              },
            ],
          }),
        ]),
      });

      // Test production task definition has higher resources
      productionTemplate.hasResourceProperties('AWS::ECS::TaskDefinition', {
        Cpu: '512',
        Memory: '1024',
      });
    });

    it('should create a Fargate service with correct configuration', () => {
      // Test staging service
      stagingTemplate.hasResourceProperties('AWS::ECS::Service', {
        LaunchType: 'FARGATE',
        DesiredCount: 1,
        NetworkConfiguration: Match.objectLike({
          AwsvpcConfiguration: {
            AssignPublicIp: 'DISABLED',
          },
        }),
      });

      // Test production service has higher count
      productionTemplate.hasResourceProperties('AWS::ECS::Service', {
        DesiredCount: 2,
      });
    });

    it('should create auto-scaling only for production', () => {
      // Staging should not have auto-scaling
      stagingTemplate.resourceCountIs('AWS::ApplicationAutoScaling::ScalableTarget', 0);

      // Production should have auto-scaling
      productionTemplate.hasResourceProperties('AWS::ApplicationAutoScaling::ScalableTarget', {
        MinCapacity: 2,
        MaxCapacity: 10,
      });

      productionTemplate.hasResourceProperties('AWS::ApplicationAutoScaling::ScalingPolicy', {
        TargetTrackingScalingPolicyConfiguration: {
          TargetValue: 70,
        },
      });
    });
  });

  describe('CloudWatch Logs', () => {
    it('should create log groups with correct retention', () => {
      // Staging log group with 1 week retention
      stagingTemplate.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: '/ecs/AIMedicalReport-staging',
        RetentionInDays: 7,
      });

      // Production log group with 1 month retention
      productionTemplate.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: '/ecs/AIMedicalReport-production',
        RetentionInDays: 30,
      });
    });
  });

  describe('Cognito Resources', () => {
    it('should create a Cognito domain', () => {
      stagingTemplate.hasResourceProperties('AWS::Cognito::UserPoolDomain', {
        Domain: 'aimedicalreport-auth',
        UserPoolId: Match.anyValue(),
      });
    });

    it('should create a Cognito user pool client', () => {
      stagingTemplate.hasResourceProperties('AWS::Cognito::UserPoolClient', {
        GenerateSecret: true,
        AllowedOAuthFlows: ['code'],
        CallbackURLs: Match.arrayWith([
          Match.stringLikeRegexp('http://aimedicalreport.example.com/oauth2/idpresponse'),
        ]),
        ExplicitAuthFlows: Match.arrayWith(['ALLOW_USER_PASSWORD_AUTH', 'ALLOW_USER_SRP_AUTH']),
      });
    });
  });

  describe('Load Balancer Resources', () => {
    it('should create an ALB with correct configuration', () => {
      stagingTemplate.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
        Scheme: 'internet-facing',
        LoadBalancerAttributes: Match.arrayWith([
          {
            Key: 'deletion_protection.enabled',
            Value: 'false',
          },
        ]),
        Type: 'application',
      });
    });

    it('should create a target group pointing to the Fargate service', () => {
      stagingTemplate.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
        Port: 3000,
        Protocol: 'HTTP',
        TargetType: 'ip',
        HealthCheckPath: '/health',
        HealthCheckTimeoutSeconds: 5,
        HealthCheckIntervalSeconds: 30,
      });
    });

    it('should create an HTTP listener with Cognito authentication', () => {
      stagingTemplate.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
        Port: 80,
        Protocol: 'HTTP',
        DefaultActions: Match.arrayWith([
          Match.objectLike({
            Type: 'authenticate-cognito',
            AuthenticateCognitoConfig: {
              UserPoolArn: Match.anyValue(),
              UserPoolClientId: Match.anyValue(),
              UserPoolDomain: Match.anyValue(),
              OnUnauthenticatedRequest: 'authenticate',
            },
            Order: 1,
          }),
          Match.objectLike({
            Type: 'forward',
            TargetGroupArn: Match.anyValue(),
            Order: 2,
          }),
        ]),
      });
    });
  });

  describe('Stack Outputs', () => {
    it('should output the load balancer DNS', () => {
      stagingTemplate.hasOutput('LoadBalancerDNS', {});
    });

    it('should output Cognito information', () => {
      stagingTemplate.hasOutput('UserPoolId', {});
      stagingTemplate.hasOutput('UserPoolClientId', {});
      stagingTemplate.hasOutput('CognitoDomain', {});
    });
  });
});
