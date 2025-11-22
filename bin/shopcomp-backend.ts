#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core'
import { LambdaStack } from '../lib/lambda-backend-stack'
import { AuthorizationStack } from '../lib/authorization-stack'
import { AndrewStack } from "../lib/andrew-stack"
import { OwenStack } from "../lib/owen-stack"
import { RyanStack } from "../lib/ryan-stack"
import { ThomasStack } from "../lib/thomas-stack"

const app = new cdk.App();

// Setup authorization stack
const authorizationStack = new AuthorizationStack(app, "AuthorizationStack", {})
// export const userPoolClientId = authorizationStack.userPoolClient.userPoolClientId

// "Master" lambda function stack
const lambdaStack = new LambdaStack(app, "LambdaStack", {
  /* If you don't specify 'env', this stack will be environment-agnostic.
   * Account/Region-dependent features and context lookups will not work,
   * but a single synthesized template can be deployed anywhere. */

  /* Uncomment the next line to specialize this stack for the AWS Account
   * and Region that are implied by the current CLI configuration. */
  // env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },

  /* Uncomment the next line if you know exactly what Account and Region you
   * want to deploy the stack to. */
  // env: { account: '123456789012', region: 'us-east-1' },

  /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
});

// Dev stacks

new AndrewStack(app, "AndrewStack", {
  apiEndpoint: lambdaStack.apiEndpoint,
  vpc: lambdaStack.vpc,
  securityGroup: lambdaStack.securityGroup,
})

new OwenStack(app, "OwenStack", {
  apiEndpoint: lambdaStack.apiEndpoint,
  vpc: lambdaStack.vpc,
  securityGroup: lambdaStack.securityGroup,
})

new RyanStack(app, "RyanStack", {
  apiEndpoint: lambdaStack.apiEndpoint,
  vpc: lambdaStack.vpc,
  securityGroup: lambdaStack.securityGroup,
})

new ThomasStack(app, "ThomasStack", {
  apiEndpoint: lambdaStack.apiEndpoint,
  vpc: lambdaStack.vpc,
  securityGroup: lambdaStack.securityGroup,
  userPool: authorizationStack.userPool
})

