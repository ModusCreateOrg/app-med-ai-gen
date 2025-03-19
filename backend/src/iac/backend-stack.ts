import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as elbv2_actions from 'aws-cdk-lib/aws-elasticloadbalancingv2-actions';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import { Construct } from 'constructs';
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb';
import { RemovalPolicy } from 'aws-cdk-lib';

interface BackendStackProps extends cdk.StackProps {
  environment: string;
  domainName?: string; // Optional domain name for certificate
  hostedZoneId?: string; // Optional hosted zone ID for domain
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
      'us-east-1_PszlvSmWc',
    );

    // Create a Cognito domain if it doesn't exist
    const userPoolDomain = new cognito.UserPoolDomain(
      this,
      `${appName}UserPoolDomain-${props.environment}`,
      {
        userPool,
        cognitoDomain: {
          domainPrefix: `modus-ai-${props.environment}`,
        },
      },
    );

    // Create ALB
    const alb = new elbv2.ApplicationLoadBalancer(this, `${appName}ALB-${props.environment}`, {
      vpc,
      internetFacing: true,
      loadBalancerName: `${appName}-${props.environment}`,
    });

    // HTTPS IMPLEMENTATION - CERTIFICATE
    let certificate;
    if (props.domainName && props.hostedZoneId) {
      // If domain name is provided, create or import certificate
      const hostedZone = route53.HostedZone.fromHostedZoneAttributes(this, 'HostedZone', {
        hostedZoneId: props.hostedZoneId,
        zoneName: props.domainName,
      });

      certificate = new acm.Certificate(this, `${appName}Certificate-${props.environment}`, {
        domainName: props.domainName,
        validation: acm.CertificateValidation.fromDns(hostedZone),
      });

      // Create DNS record for ALB
      new route53.ARecord(this, `${appName}AliasRecord-${props.environment}`, {
        zone: hostedZone,
        recordName: props.domainName,
        target: route53.RecordTarget.fromAlias(new targets.LoadBalancerTarget(alb)),
      });
    } else {
      // For development or when no domain is provided, generate a self-signed certificate
      certificate = new acm.Certificate(this, `${appName}SelfSignedCert-${props.environment}`, {
        domainName: alb.loadBalancerDnsName,
        validation: acm.CertificateValidation.fromDns(),
      });
    }

    // Create a Cognito User Pool Client for the ALB
    const userPoolClient = new cognito.UserPoolClient(
      this,
      `${appName}UserPoolClient-${props.environment}`,
      {
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
          // Update callback URLs to use HTTPS
          callbackUrls: props.domainName
            ? [`https://${props.domainName}/oauth2/idpresponse`]
            : [`https://${alb.loadBalancerDnsName}/oauth2/idpresponse`],
        },
      },
    );

    // Create Fargate Service
    const fargateService = new ecs.FargateService(this, `${appName}Service-${props.environment}`, {
      cluster,
      taskDefinition,
      desiredCount: isProd ? 2 : 1,
      assignPublicIp: false,
      securityGroups: [
        new ec2.SecurityGroup(this, `${appName}ServiceSG-${props.environment}`, {
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
        targets: [fargateService],
      },
    );

    // HTTPS IMPLEMENTATION - LISTENERS

    // Create HTTPS Listener
    alb.addListener(`${appName}HttpsListener-${props.environment}`, {
      port: 443,
      protocol: elbv2.ApplicationProtocol.HTTPS,
      certificates: [certificate],
      sslPolicy: elbv2.SslPolicy.RECOMMENDED,
      defaultAction: new elbv2_actions.AuthenticateCognitoAction({
        userPool,
        userPoolClient,
        userPoolDomain: userPoolDomain,
        next: elbv2.ListenerAction.forward([targetGroup]),
        onUnauthenticatedRequest: elbv2.UnauthenticatedAction.AUTHENTICATE,
      }),
    });

    // Create HTTP Listener that redirects to HTTPS
    alb.addListener(`${appName}HttpListener-${props.environment}`, {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultAction: elbv2.ListenerAction.redirect({
        protocol: elbv2.ApplicationProtocol.HTTPS,
        port: '443',
        permanent: true,
      }),
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
