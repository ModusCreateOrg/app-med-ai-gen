import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { BackendStack } from './backend-stack';

describe('BackendStack', () => {
  const app = new cdk.App();
  const stack = new BackendStack(app, 'TestStack');
  const template = Template.fromStack(stack);

  it('should create a VPC', () => {
    template.hasResourceProperties('AWS::EC2::VPC', {
      EnableDnsHostnames: true,
      EnableDnsSupport: true,
      CidrBlock: '10.0.0.0/16',
      InstanceTenancy: 'default',
    });

    // Verify we have the correct number of subnets for 2 AZs
    template.resourceCountIs('AWS::EC2::Subnet', 4); // 2 public + 2 private subnets
  });

  it('should create an ECS cluster', () => {
    template.hasResourceProperties('AWS::ECS::Cluster', {
      ClusterSettings: [
        {
          Name: 'containerInsights',
          Value: 'enabled',
        },
      ],
    });
  });

  it('should create a Fargate service', () => {
    template.hasResourceProperties('AWS::ECS::Service', {
      LaunchType: 'FARGATE',
      DesiredCount: 2,
    });

    template.hasResourceProperties('AWS::ECS::TaskDefinition', {
      ContainerDefinitions: [
        {
          Environment: [
            {
              Name: 'NODE_ENV',
              Value: 'production',
            },
          ],
          PortMappings: [
            {
              ContainerPort: 3000,
              Protocol: 'tcp',
            },
          ],
        },
      ],
      Cpu: '256',
      Memory: '512',
      NetworkMode: 'awsvpc',
      RequiresCompatibilities: ['FARGATE'],
    });
  });

  it('should create an API Gateway', () => {
    template.hasResourceProperties('AWS::ApiGateway::RestApi', {
      Name: 'Medical Reports API',
    });

    template.hasResourceProperties('AWS::ApiGateway::Method', {
      HttpMethod: 'ANY',
      AuthorizationType: 'NONE',
    });
  });

  it('should create load balancer', () => {
    template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
      Type: 'application',
    });
  });

  it('should output API URL and Load Balancer DNS', () => {
    template.hasOutput('ApiUrl', {});
    template.hasOutput('LoadBalancerDNS', {});
  });
});
