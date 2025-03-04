import { App } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { SimpleStack } from './simple-stack';

jest.mock('../fns/useEnv', () => ({
  nameIt: jest.fn().mockReturnValue('simple-bucket'),
  getMessage: jest.fn().mockReturnValue('mocked message'),
}));

it('should create a s3 bucket', () => {
  const app = new App();
  const stack = new SimpleStack(app, 'simple-stack');
  const template = Template.fromStack(stack);
  template.hasResourceProperties('AWS::S3::Bucket', {
    BucketName: 'simple-bucket',
  });
});
