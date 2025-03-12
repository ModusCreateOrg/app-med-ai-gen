import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as elbv2_actions from 'aws-cdk-lib/aws-elasticloadbalancingv2-actions';
import * as constructs from 'constructs';

interface BackendStackProps extends cdk.StackProps {
  environment: string;
}

export class BackendStack extends cdk.Stack {
  constructor(scope: constructs.Construct, id: string, props: BackendStackProps) {
    super(scope, id, props);

    const isProd = props.environment === 'production';
    const appName = 'AIMedicalReport';

    // Look up existing VPC or create a new one
    let vpc: ec2.IVpc;
    try {
      vpc = ec2.Vpc.fromLookup(this, `${appName}VPC`, {
        isDefault: false,
        vpcName: `${appName}VPC`,
      });
    } catch {
      vpc = new ec2.Vpc(this, `${appName}VPC`, {
        vpcName: `${appName}VPC`,
        maxAzs: isProd ? 3 : 2,
      });
    }

    // Look up existing ECS Cluster or create a new one
    const cluster = new ecs.Cluster(this, `${appName}Cluster`, {
      vpc,
      clusterName: `${appName}Cluster`,
      containerInsights: true,
    });

    // Create Log Group for container
    const logGroup = new logs.LogGroup(this, `${appName}LogGroup`, {
      logGroupName: `/ecs/${appName}-${props.environment}`,
      retention: isProd ? logs.RetentionDays.ONE_MONTH : logs.RetentionDays.ONE_WEEK,
      removalPolicy: isProd ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    });

    // Task Definition
    const taskDefinition = new ecs.FargateTaskDefinition(this, `${appName}TaskDef`, {
      memoryLimitMiB: isProd ? 1024 : 512,
      cpu: isProd ? 512 : 256,
    });

    // Container
    const container = taskDefinition.addContainer(`${appName}Container`, {
      image: ecs.ContainerImage.fromAsset('../backend/', {
        file: 'Dockerfile.prod',
        buildArgs: {
          NODE_ENV: props.environment,
        },
      }),
      environment: {
        NODE_ENV: props.environment,
        PERPLEXITY_API_KEY_SECRET_NAME: `medical-reports-explainer/${props.environment}/perplexity-api-key`,
        PERPLEXITY_MODEL: 'sonar',
        PERPLEXITY_MAX_TOKENS: '2048',
      },
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: appName,
        logGroup,
      }),
    });

    container.addPortMappings({
      containerPort: 3000,
      protocol: ecs.Protocol.TCP,
    });

    // Look up existing Cognito User Pool
    const userPool = cognito.UserPool.fromUserPoolId(
      this,
      `${appName}UserPool`,
      'ai-cognito-medical-reports-user-pool'
    );

    // Create a Cognito domain if it doesn't exist
    const userPoolDomain = new cognito.UserPoolDomain(this, `${appName}UserPoolDomain`, {
      userPool,
      cognitoDomain: {
        domainPrefix: `${appName.toLowerCase()}-auth`,
      },
    });

    // Create a Cognito User Pool Client for the ALB
    const userPoolClient = new cognito.UserPoolClient(this, `${appName}UserPoolClient`, {
      userPool,
      generateSecret: true,
      authFlows: {
        userPassword: true,
        userSrp: true,
      },
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
        },
        callbackUrls: [`http://${appName.toLowerCase()}.example.com/oauth2/idpresponse`], // Update with your actual domain
      },
    });

    // Create ALB
    const alb = new elbv2.ApplicationLoadBalancer(this, `${appName}ALB`, {
      vpc,
      internetFacing: true,
      loadBalancerName: `${appName}-${props.environment}`,
    });

    // Create Fargate Service
    const fargateService = new ecs.FargateService(this, `${appName}Service`, {
      cluster,
      taskDefinition,
      desiredCount: isProd ? 2 : 1,
      assignPublicIp: false,
      securityGroups: [
        new ec2.SecurityGroup(this, `${appName}ServiceSG`, {
          vpc,
          allowAllOutbound: true,
        }),
      ],
    });

    // Add autoscaling for production
    if (isProd) {
      const scaling = fargateService.autoScaleTaskCount({
        minCapacity: 2,
        maxCapacity: 10,
      });

      scaling.scaleOnCpuUtilization(`${appName}CpuScaling`, {
        targetUtilizationPercent: 70,
        scaleInCooldown: cdk.Duration.seconds(60),
        scaleOutCooldown: cdk.Duration.seconds(60),
      });
    }

    // Create ALB Target Group
    const targetGroup = new elbv2.ApplicationTargetGroup(this, `${appName}TargetGroup`, {
      vpc,
      port: 3000,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targetType: elbv2.TargetType.IP,
      healthCheck: {
        path: '/health',
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
      },
      targets: [fargateService],
    });

    // Create HTTP Listener
    alb.addListener(`${appName}HttpListener`, {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultAction: new elbv2_actions.AuthenticateCognitoAction({
        userPool,
        userPoolClient,
        userPoolDomain: userPoolDomain.domainName,
        next: elbv2.ListenerAction.forward([targetGroup]),
        onUnauthenticatedRequest: elbv2.UnauthenticatedAction.AUTHENTICATE,
      }),
    });

    // Add output for Cognito domain
    new cdk.CfnOutput(this, 'CognitoDomain', {
      value: `https://${userPoolDomain.domainName}.auth.${this.region}.amazoncognito.com`,
      description: 'Cognito Domain URL',
    });

    // Outputs
    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: alb.loadBalancerDnsName,
      description: 'Load Balancer DNS Name',
    });

    new cdk.CfnOutput(this, 'UserPoolId', {
      value: userPool.userPoolId,
      description: 'Cognito User Pool ID',
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: userPoolClient.userPoolClientId,
      description: 'Cognito User Pool Client ID',
    });
  }
}
