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

    // Create Task Execution Role - this is used during task startup
    const taskExecutionRole = new iam.Role(
      this,
      `${appName}TaskExecutionRole-${props.environment}`,
      {
        assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
        description:
          'Role that the ECS service uses to pull container images and publish logs to CloudWatch',
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'service-role/AmazonECSTaskExecutionRolePolicy',
          ),
        ],
      },
    );

    // Create Task Role - this is used by the container during runtime
    const taskRole = new iam.Role(this, `${appName}TaskRole-${props.environment}`, {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      description: 'Role that the containers in the task assume',
    });

    // Grant permissions to the task role
    // DynamoDB permissions
    reportsTable.grantReadWriteData(taskRole);

    // Add permission to read Perplexity API key from Secrets Manager
    taskRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['secretsmanager:GetSecretValue', 'secretsmanager:DescribeSecret'],
        resources: [
          `arn:aws:secretsmanager:${this.region}:${this.account}:secret:medical-reports-explainer/${props.environment}/perplexity-api-key-*`,
        ],
      }),
    );

    // Task Definition with explicit roles
    const taskDefinition = new ecs.FargateTaskDefinition(
      this,
      `${appName}TaskDef-${props.environment}`,
      {
        memoryLimitMiB: isProd ? 1024 : 512,
        cpu: isProd ? 512 : 256,
        taskRole: taskRole, // Role that the application uses to call AWS services
        executionRole: taskExecutionRole, // Role that ECS uses to pull images and write logs
      },
    );

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
    });

    // Grant the task role access to read the SSL certificate secret
    certificateSecret.grantRead(taskRole);

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
    // Security note: This NLB is internal-only within a private subnet and not internet-facing.
    // External traffic is secured via API Gateway's HTTPS endpoints, so unencrypted internal
    // communication within the VPC's private network boundary is acceptable here.
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

    // Create API Gateway first without any resources or methods
    const apiLogicalId = `${appName}-api-${props.environment}`;
    const api = new apigateway.RestApi(this, apiLogicalId, {
      restApiName: `${appName}-${props.environment}`,
      description: `API for ${appName} ${props.environment}`,
      deployOptions: {
        stageName: props.environment,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
      },
      // Important: Do NOT use defaultCorsPreflightOptions here
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

    // Define the service URL using the NLB DNS
    const serviceUrl = `http://${nlb.loadBalancerDnsName}`;

    // Create the 'api' resource
    const apiResource = api.root.addResource('api');

    // Create the 'docs' resource under 'api'
    const docsResource = apiResource.addResource('docs');

    // Create the 'reports' resource under 'api'
    const reportsResource = apiResource.addResource('reports');

    // Create the 'latest' resource under 'reports'
    const latestResource = reportsResource.addResource('latest');

    // Create the ':id' resource under 'reports' with a path parameter
    const reportIdResource = reportsResource.addResource('{id}');

    // Create the 'status' resource under ':id'
    const reportStatusResource = reportIdResource.addResource('status');

    // Define integration options once for reuse
    const integrationOptions = {
      connectionType: apigateway.ConnectionType.VPC_LINK,
      vpcLink: vpcLink,
    };

    const getDocsIntegration = new apigateway.Integration({
      type: apigateway.IntegrationType.HTTP_PROXY,
      integrationHttpMethod: 'GET',
      uri: `${serviceUrl}/api/docs`,
      options: integrationOptions,
    });

    // Create integrations for each endpoint
    const getReportsIntegration = new apigateway.Integration({
      type: apigateway.IntegrationType.HTTP_PROXY,
      integrationHttpMethod: 'GET',
      uri: `${serviceUrl}/api/reports`,
      options: integrationOptions,
    });

    const getLatestReportIntegration = new apigateway.Integration({
      type: apigateway.IntegrationType.HTTP_PROXY,
      integrationHttpMethod: 'GET',
      uri: `${serviceUrl}/api/reports/latest`,
      options: integrationOptions,
    });

    const getReportByIdIntegration = new apigateway.Integration({
      type: apigateway.IntegrationType.HTTP_PROXY,
      integrationHttpMethod: 'GET',
      uri: `${serviceUrl}/api/reports/{id}`,
      options: {
        ...integrationOptions,
        requestParameters: {
          'integration.request.path.id': 'method.request.path.id',
        },
      },
    });

    const patchReportStatusIntegration = new apigateway.Integration({
      type: apigateway.IntegrationType.HTTP_PROXY,
      integrationHttpMethod: 'PATCH',
      uri: `${serviceUrl}/api/reports/{id}/status`,
      options: {
        ...integrationOptions,
        requestParameters: {
          'integration.request.path.id': 'method.request.path.id',
        },
      },
    });

    // Define method options with authorization
    const methodOptions = {
      authorizer: authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    };

    // Add methods to the resources
    reportsResource.addMethod('GET', getReportsIntegration, methodOptions);
    latestResource.addMethod('GET', getLatestReportIntegration, methodOptions);
    docsResource.addMethod('GET', getDocsIntegration, methodOptions);
    // For path parameter methods, add the request parameter configuration
    reportIdResource.addMethod('GET', getReportByIdIntegration, {
      ...methodOptions,
      requestParameters: {
        'method.request.path.id': true,
      },
    });

    reportStatusResource.addMethod('PATCH', patchReportStatusIntegration, {
      ...methodOptions,
      requestParameters: {
        'method.request.path.id': true,
      },
    });

    // Add CORS to each resource separately - after methods have been created
    const corsOptions = {
      allowOrigins: ['*'],
      allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'Authorization', 'X-Amz-Date', 'X-Api-Key'],
      maxAge: cdk.Duration.seconds(300),
    };

    // Add CORS to all resources
    api.root.addCorsPreflight(corsOptions);
    apiResource.addCorsPreflight(corsOptions);
    reportsResource.addCorsPreflight(corsOptions);
    latestResource.addCorsPreflight(corsOptions);
    reportIdResource.addCorsPreflight(corsOptions);
    reportStatusResource.addCorsPreflight(corsOptions);
    docsResource.addCorsPreflight(corsOptions);

    // Create API Gateway execution role with required permissions
    new iam.Role(this, `${appName}APIGatewayRole-${props.environment}`, {
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
