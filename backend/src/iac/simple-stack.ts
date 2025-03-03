import { RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";
import { nameIt, getMessage } from "../fns/useEnv";

export class SimpleStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);
        console.log(getMessage());
        new Bucket(this, nameIt("simple-bucket"), {
            bucketName: nameIt("simple-bucket"),
            removalPolicy: RemovalPolicy.DESTROY,
        });
    }
}