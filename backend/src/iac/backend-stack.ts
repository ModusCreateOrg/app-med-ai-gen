import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as servicediscovery from 'aws-cdk-lib/aws-servicediscovery';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';

import { Construct } from 'constructs';
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb';
import { RemovalPolicy } from 'aws-cdk-lib';

interface BackendStackProps extends cdk.StackProps {
  environment: string;
  cognitoClientId: string;
  cognitoUserPoolId: string;
}

export class BackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: BackendStackProps) {
    super(scope, id, props);

    const isProd = props.environment === 'production';
    const appName = 'AIMedicalReport';

    // VPC
    const vpc = new ec2.Vpc(this, `${appName}VPC`, {
      vpcName: `${appName}VPC-${props.environment}`,
      maxAzs: 2,
      natGateways: isProd ? 2 : 1,
    });

    // ECS Cluster
    const cluster = new ecs.Cluster(this, `${appName}Cluster`, {
      vpc,
      clusterName: `${appName}Cluster-${props.environment}`,
      containerInsights: true,
      enableFargateCapacityProviders: true,
    });

    // CloudMap Namespace for service discovery
    cluster.addDefaultCloudMapNamespace({
      name: `${appName.toLowerCase()}.local`,
    });

    // Log Group
    const logGroup = new logs.LogGroup(this, `${appName}LogGroup`, {
      logGroupName: `/ecs/${appName}-${props.environment}`,
      retention: isProd ? logs.RetentionDays.ONE_MONTH : logs.RetentionDays.ONE_WEEK,
      removalPolicy: isProd ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    });

    // DynamoDB table for reports
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

    // Add GSI for querying by date
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

    // Cognito User Pool
    const userPool = cognito.UserPool.fromUserPoolId(
      this,
      `${appName}UserPool`,
      props.cognitoUserPoolId || 'us-east-1_PszlvSmWc',
    );

    // Cognito domain
    const userPoolDomain = cognito.UserPoolDomain.fromDomainName(
      this,
      `${appName}ExistingDomain-${props.environment}`,
      'us-east-1pszlvsmwc',
    );

    // User Pool Client
    const userPoolClient = cognito.UserPoolClient.fromUserPoolClientId(
      this,
      `${appName}UserPoolClient-${props.environment}`,
      props.cognitoClientId,
    );

    // Security Group for Fargate service
    const serviceSecurityGroup = new ec2.SecurityGroup(
      this,
      `${appName}ServiceSG-${props.environment}`,
      {
        vpc,
        allowAllOutbound: true,
        description: 'Security group for Fargate service',
      },
    );

    // Add inbound rules to allow traffic from API Gateway
    serviceSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(vpc.vpcCidrBlock),
      ec2.Port.tcp(3000),
      'Allow inbound HTTP traffic from within VPC',
    );

    serviceSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(vpc.vpcCidrBlock),
      ec2.Port.tcp(3443),
      'Allow inbound HTTPS traffic from within VPC',
    );

    // Task Definition
    const taskDefinition = new ecs.FargateTaskDefinition(
      this,
      `${appName}TaskDef-${props.environment}`,
      {
        memoryLimitMiB: isProd ? 1024 : 512,
        cpu: isProd ? 512 : 256,
      },
    );

    // Grant DynamoDB permissions to task
    reportsTable.grantReadWriteData(taskDefinition.taskRole);

    // Create a secrets manager for the SSL certificate and key
    const certificateSecret = new cdk.aws_secretsmanager.Secret(
      this,
      `${appName}CertSecret-${props.environment}`,
      {
        secretName: `${appName}/ssl-cert-${props.environment}`,
        description: 'SSL certificate and private key for HTTPS',
        generateSecretString: {
          secretStringTemplate: JSON.stringify({
            // You'll need to populate these values after deployment
            certificate:
              '-----BEGIN CERTIFICATE-----\nYour certificate here\n-----END CERTIFICATE-----',
            privateKey:
              '-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----',
          }),
          generateStringKey: 'dummy', // This key won't be used but is required
        },
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
        HTTPS_PORT: '3443', // Add HTTPS port
        ENABLE_HTTPS: 'true', // Enable HTTPS

        // AWS related
        AWS_REGION: this.region,
        AWS_COGNITO_USER_POOL_ID: userPool.userPoolId,
        AWS_COGNITO_CLIENT_ID: userPoolClient.userPoolClientId,
        DYNAMODB_REPORTS_TABLE: reportsTable.tableName,

        // Perplexity related
        PERPLEXITY_API_KEY_SECRET_NAME: `medical-reports-explainer/${props.environment}/perplexity-api-key`,
        PERPLEXITY_MODEL: 'sonar',
        PERPLEXITY_MAX_TOKENS: '2048',

        // SSL Certificate secret
        SSL_CERT_SECRET_NAME: certificateSecret.secretName,
      },
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: appName,
        logGroup,
      }),
      /*healthCheck: {
        command: ['CMD-SHELL', 'curl -f -k https://localhost:3443/api/health || exit 1'],
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        retries: 3,
        startPeriod: cdk.Duration.seconds(60),
      },*/
    });

    // Grant the task role access to read the SSL certificate secret
    certificateSecret.grantRead(taskDefinition.taskRole);

    container.addPortMappings({
      containerPort: 3000,
      name: 'http-api',
      protocol: ecs.Protocol.TCP,
    });

    container.addPortMappings({
      containerPort: 3443,
      name: 'https-api',
      protocol: ecs.Protocol.TCP,
    });

    // Create Fargate Service with CloudMap service discovery
    const fargateService = new ecs.FargateService(this, `${appName}Service-${props.environment}`, {
      cluster,
      taskDefinition,
      desiredCount: isProd ? 2 : 1,
      securityGroups: [serviceSecurityGroup],
      assignPublicIp: false, // Using private subnets with NAT gateway
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      cloudMapOptions: {
        name: `${appName.toLowerCase()}-service`,
        dnsRecordType: servicediscovery.DnsRecordType.A,
        dnsTtl: cdk.Duration.seconds(30),
        container: container,
        containerPort: 3000,
      },
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

    // Create a Network Load Balancer for the Fargate service
    const nlb = new elbv2.NetworkLoadBalancer(this, `${appName}NLB-${props.environment}`, {
      vpc,
      internetFacing: false,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
    });

    // Add a listener to the NLB
    const listener = nlb.addListener(`${appName}Listener-${props.environment}`, {
      port: 80,
      protocol: elbv2.Protocol.TCP,
    });

    // Add the Fargate service as a target to the listener
    listener.addTargets(`${appName}TargetGroup-${props.environment}`, {
      targets: [fargateService],
      port: 3000,
      protocol: elbv2.Protocol.TCP,
      healthCheck: {
        enabled: true,
        protocol: elbv2.Protocol.HTTP,
        path: '/api/health',
        interval: cdk.Duration.seconds(30),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 2,
        timeout: cdk.Duration.seconds(5),
      },
    });

    // Create VPC Link for API Gateway using the NLB
    const vpcLink = new apigateway.VpcLink(this, `${appName}VpcLink-${props.environment}`, {
      targets: [nlb],
      description: `VPC Link for ${appName} ${props.environment}`,
    });

    // Create API Gateway
    const api = new apigateway.RestApi(this, `${appName}Api-${props.environment}`, {
      restApiName: `${appName}-${props.environment}`,
      description: `API for ${appName} ${props.environment}`,
      deployOptions: {
        stageName: props.environment,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization', 'X-Amz-Date', 'X-Api-Key'],
      },
    });

    // Create Cognito Authorizer
    const authorizer = new apigateway.CognitoUserPoolsAuthorizer(
      this,
      `${appName}Authorizer-${props.environment}`,
      {
        cognitoUserPools: [userPool],
        authorizerName: `${appName}Authorizer-${props.environment}`,
        identitySource: 'method.request.header.Authorization',
      },
    );

    // Use the NLB DNS name for the service URL
    const serviceUrl = `http://${nlb.loadBalancerDnsName}`;

    // Create proxy resource with Cognito authorization
    const proxyResource = api.root.addResource('{proxy+}');

    // Integration with Fargate service via VPC Link
    const integration = new apigateway.Integration({
      type: apigateway.IntegrationType.HTTP_PROXY,
      integrationHttpMethod: 'ANY',
      options: {
        connectionType: apigateway.ConnectionType.VPC_LINK,
        vpcLink: vpcLink,
        requestParameters: {
          'integration.request.path.proxy': 'method.request.path.proxy',
        },
      },
      uri: `${serviceUrl}/{proxy}`,
    });

    proxyResource.addMethod('ANY', integration, {
      authorizer: authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
      requestParameters: {
        'method.request.path.proxy': true,
      },
    });

    // Add health check endpoint without authorization
    const healthResource = api.root.addResource('health');
    healthResource.addMethod(
      'GET',
      new apigateway.Integration({
        type: apigateway.IntegrationType.HTTP_PROXY,
        integrationHttpMethod: 'GET',
        options: {
          connectionType: apigateway.ConnectionType.VPC_LINK,
          vpcLink: vpcLink,
        },
        uri: `${serviceUrl}/api/health`,
      }),
    );

    // Add execution role policy to allow API Gateway to access VPC resources
    new iam.Role(this, `${appName}APIGatewayVPCRole-${props.environment}`, {
      assumedBy: new iam.ServicePrincipal('apigateway.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AmazonAPIGatewayPushToCloudWatchLogs',
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonVPCCrossAccountNetworkInterfaceOperations',
        ),
      ],
    });

    const apiResourcePolicy = new iam.PolicyDocument({
      statements: [
        // Allow all users to access the health endpoint in all stages
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          principals: [new iam.AnyPrincipal()],
          actions: ['execute-api:Invoke'],
          resources: [
            `arn:aws:execute-api:${this.region}:${this.account}:${api.restApiId}/*/GET/health`,
          ],
        }),

        // Allow only authenticated Cognito users to access all other endpoints
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          principals: [new iam.AnyPrincipal()],
          actions: ['execute-api:Invoke'],
          resources: [`arn:aws:execute-api:${this.region}:${this.account}:${api.restApiId}/*/*`],
          conditions: {
            StringEquals: {
              'aws:PrincipalTag/cognito-identity.amazonaws.com:sub':
                '${cognito-identity.amazonaws.com:sub}',
            },
          },
        }),

        // Deny all non-HTTPS requests
        new iam.PolicyStatement({
          effect: iam.Effect.DENY,
          principals: [new iam.AnyPrincipal()],
          actions: ['execute-api:Invoke'],
          resources: [`arn:aws:execute-api:${this.region}:${this.account}:${api.restApiId}/*/*`],
          conditions: {
            Bool: {
              'aws:SecureTransport': 'false',
            },
          },
        }),
      ],
    });

    // Apply the policy to the API Gateway using CfnRestApi
    const cfnApi = api.node.defaultChild as apigateway.CfnRestApi;
    cfnApi.policy = apiResourcePolicy.toJSON();

    // Outputs
    new cdk.CfnOutput(this, 'ReportsTableName', {
      value: reportsTable.tableName,
      description: 'DynamoDB Reports Table Name',
    });

    new cdk.CfnOutput(this, 'CognitoDomain', {
      value: `https://${userPoolDomain.domainName}.auth.${this.region}.amazoncognito.com`,
      description: 'Cognito Domain URL',
    });

    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      value: api.url,
      description: 'API Gateway URL',
    });

    new cdk.CfnOutput(this, 'NetworkLoadBalancerDns', {
      value: nlb.loadBalancerDnsName,
      description: 'Network Load Balancer DNS Name',
    });
  }
}
