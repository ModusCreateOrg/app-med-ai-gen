import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb';
import { RemovalPolicy } from 'aws-cdk-lib';

interface BackendStackProps extends cdk.StackProps {
  environment: string;
  domainName?: string; // Optional domain name for certificate
  hostedZoneId?: string; // Optional hosted zone ID for domain
  cognitoClientId: string;
  cognitoUserPoolId: string;
}

export class BackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: BackendStackProps) {
    super(scope, id, props);

    const isProd = props.environment === 'production';
    const appName = 'AIMedicalReport';

    // Look up existing VPC or create a new one
    const vpc: ec2.IVpc = new ec2.Vpc(this, `${appName}VPC`, {
      vpcName: `${appName}VPC-${props.environment}`,
      maxAzs: 2,
    });

    const cluster = new ecs.Cluster(this, `${appName}Cluster`, {
      vpc,
      clusterName: `${appName}Cluster-${props.environment}`,
      containerInsights: true,
    });

    // Create Log Group for container
    const logGroup = new logs.LogGroup(this, `${appName}LogGroup`, {
      logGroupName: `/ecs/${appName}-${props.environment}`,
      retention: isProd ? logs.RetentionDays.ONE_MONTH : logs.RetentionDays.ONE_WEEK,
      removalPolicy: isProd ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    });

    // Create DynamoDB table for reports
    const reportsTable = new Table(this, `${appName}ReportsTable-${props.environment}`, {
      tableName: `${appName}ReportsTable${props.environment}`,
      partitionKey: {
        name: 'userId',
        type: AttributeType.STRING,
      },
      sortKey: {
        name: 'id',
        type: AttributeType.STRING,
      },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: isProd ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
    });

    // Add a GSI for querying by date (most recent first)
    reportsTable.addGlobalSecondaryIndex({
      indexName: 'userIdDateIndex',
      partitionKey: {
        name: 'userId',
        type: AttributeType.STRING,
      },
      sortKey: {
        name: 'date',
        type: AttributeType.STRING,
      },
    });

    // Look up existing Cognito User Pool
    const userPoolId =
      props.cognitoUserPoolId ||
      cognito.UserPool.fromUserPoolId(this, `${appName}UserPool`, 'us-east-1_PszlvSmWc').userPoolId;

    // Create a Cognito domain if it doesn't exist
    const userPoolDomain = cognito.UserPoolDomain.fromDomainName(
      this,
      `${appName}ExistingDomain-${props.environment}`,
      'us-east-1pszlvsmwc', // The domain prefix without the .auth.region.amazoncognito.com part
    );

    // Replace the userPoolClient reference with a direct reference to the client ID
    const userPoolClientId = props.cognitoClientId;

    // Task Definition
    const taskDefinition = new ecs.FargateTaskDefinition(
      this,
      `${appName}TaskDef-${props.environment}`,
      {
        memoryLimitMiB: isProd ? 1024 : 512,
        cpu: isProd ? 512 : 256,
      },
    );

    // Container
    const container = taskDefinition.addContainer(`${appName}Container-${props.environment}`, {
      image: ecs.ContainerImage.fromAsset('../backend/', {
        file: 'Dockerfile.prod',
        buildArgs: {
          NODE_ENV: props.environment,
        },
      }),
      environment: {
        // Basic environment variables
        NODE_ENV: props.environment,
        PORT: '3000',

        // AWS related
        AWS_REGION: this.region,
        AWS_COGNITO_USER_POOL_ID: userPoolId,
        AWS_COGNITO_CLIENT_ID: userPoolClientId,
        DYNAMODB_REPORTS_TABLE: reportsTable.tableName,

        // Perplexity related
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

    // 1. Create ALB
    const alb = new elbv2.ApplicationLoadBalancer(this, `${appName}ALB-${props.environment}`, {
      vpc,
      internetFacing: true,
      loadBalancerName: `${appName}-${props.environment}`,
    });

    // 2. Create ALB Target Group
    const targetGroup = new elbv2.ApplicationTargetGroup(
      this,
      `${appName}TargetGroup-${props.environment}`,
      {
        vpc,
        port: 3000,
        protocol: elbv2.ApplicationProtocol.HTTP,
        targetType: elbv2.TargetType.IP,
        healthCheck: {
          path: '/health',
          interval: cdk.Duration.seconds(30),
          timeout: cdk.Duration.seconds(5),
        },
      },
    );

    // 3. HTTP 80 Listener
    const httpListener = alb.addListener(`${appName}HttpListener-${props.environment}`, {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultAction: elbv2.ListenerAction.forward([targetGroup]),
    });

    // 4. Create a security group for the Fargate service
    const serviceSecurityGroup = new ec2.SecurityGroup(
      this,
      `${appName}ServiceSG-${props.environment}`,
      {
        vpc,
        allowAllOutbound: true,
      },
    );

    // 5. Create the Fargate service WITHOUT registering it with the target group yet
    const fargateService = new ecs.FargateService(this, `${appName}Service-${props.environment}`, {
      cluster,
      taskDefinition,
      desiredCount: isProd ? 2 : 1,
      assignPublicIp: false,
      securityGroups: [serviceSecurityGroup],
    });

    // 6. Add explicit dependency to ensure the listener exists before the service
    fargateService.node.addDependency(httpListener);

    // 7. Now register the service with the target group
    targetGroup.addTarget(fargateService);

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

    // Add output for the table name
    new cdk.CfnOutput(this, 'ReportsTableName', {
      value: reportsTable.tableName,
      description: 'DynamoDB Reports Table Name',
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
  }
}
