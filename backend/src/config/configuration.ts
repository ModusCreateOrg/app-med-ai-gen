export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  environment: process.env.NODE_ENV || 'development',
  aws: {
    region: process.env.AWS_REGION,
    cognito: {
      userPoolId: process.env.AWS_COGNITO_USER_POOL_ID,
      clientId: process.env.AWS_COGNITO_CLIENT_ID,
    },
  },
}); 