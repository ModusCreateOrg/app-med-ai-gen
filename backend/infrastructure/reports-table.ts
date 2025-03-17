import { Construct } from 'constructs';
import { RemovalPolicy } from 'aws-cdk-lib';
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb';

export function createReportsTable(scope: Construct, id: string): Table {
  const table = new Table(scope, id, {
    tableName: 'reports',
    partitionKey: {
      name: 'id',
      type: AttributeType.STRING,
    },
    billingMode: BillingMode.PAY_PER_REQUEST,
    removalPolicy: RemovalPolicy.RETAIN,
  });

  // Add a GSI for querying by userId
  table.addGlobalSecondaryIndex({
    indexName: 'userIdIndex',
    partitionKey: {
      name: 'userId',
      type: AttributeType.STRING,
    },
    sortKey: {
      name: 'createdAt',
      type: AttributeType.STRING,
    },
  });

  return table;
}
