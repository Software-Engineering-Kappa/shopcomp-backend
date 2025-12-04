#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core'
// import { LambdaStack } from '../lib/lambda-backend-stack'
import { AddStoresStack } from '../lib/add-stores-stack'
import { AddChainsStack } from '../lib/add-chains-stack'
import { AddReceiptsStack } from '../lib/add-receipts-stack'
import { AuthorizationStack } from '../lib/authorization-stack'
import { ApiStack } from "../lib/api-stack"
import { VpcStack } from "../lib/vpc-stack"
import { ConfirmShopperStack } from "../lib/confirm-shopper-stack"
import { GetStoreInfoStack } from "../lib/get-store-info-stack"
import { GetChainInfoStack } from "../lib/get-chain-info-stack"
import { ListChainsStack } from "../lib/list-chains-stack"
import { ListPurchasesStack } from "../lib/list-purchases-stack"
import { ListStoresStack } from "../lib/list-stores-stack"
import { LoginShopperStack } from "../lib/login-shopper-stack"
import { RegisterShopperStack } from "../lib/register-shopper-stack"
import { ResendConfirmationStack } from "../lib/resend-confirmation-stack"
import { ShowAccountDashboardStack } from "../lib/show-account-dashboard-stack"
import { ReviewActivityStack } from '../lib/review-activity-stack'
import { ListReceiptsStack } from '../lib/list-receipts-stack'

// import { AndrewStack } from "../lib/andrew-stack"
// import { OwenStack } from "../lib/owen-stack"
// import { RyanStack } from "../lib/ryan-stack"
// import { ThomasStack } from "../lib/thomas-stack"

const app = new cdk.App();

// Setup authorization stack
const authorizationStack = new AuthorizationStack(app, "AuthorizationStack", {})
// export const userPoolClientId = authorizationStack.userPoolClient.userPoolClientId

// Setup API stack
const apiStack = new ApiStack(app, "ApiStack", {
  userPool: authorizationStack.userPool,
})

// Setup VPC stack
const vpcStack = new VpcStack(app, "VpcStack", {})

new AddReceiptsStack(app, "AddReceiptsStack", {
  apiEndpoint: apiStack.apiEndpoint,
  vpc: vpcStack.vpc,
  securityGroup: vpcStack.securityGroup,
  authorizer: apiStack.authorizer,
})

new AddStoresStack(app, "AddStoresStack", {
  apiEndpoint: apiStack.apiEndpoint,
  vpc: vpcStack.vpc,
  securityGroup: vpcStack.securityGroup,
  authorizer: apiStack.authorizer,
})

new AddChainsStack(app, "AddChainsStack", {
  apiEndpoint: apiStack.apiEndpoint,
  vpc: vpcStack.vpc,
  securityGroup: vpcStack.securityGroup,
  authorizer: apiStack.authorizer,
})

new ConfirmShopperStack(app, "ConfirmShopperStack", {
  apiEndpoint: apiStack.apiEndpoint,
  vpc: vpcStack.vpc,
  securityGroup: vpcStack.securityGroup,
})

new GetChainInfoStack(app, "GetChainInfoStack", {
  apiEndpoint: apiStack.apiEndpoint,
  vpc: vpcStack.vpc,
  securityGroup: vpcStack.securityGroup,
  authorizer: apiStack.authorizer,
})

new GetStoreInfoStack(app, "GetStoreInfoStack", {
  apiEndpoint: apiStack.apiEndpoint,
  vpc: vpcStack.vpc,
  securityGroup: vpcStack.securityGroup,
  authorizer: apiStack.authorizer,
})

new ListChainsStack(app, "ListChainsStack", {
  apiEndpoint: apiStack.apiEndpoint,
  vpc: vpcStack.vpc,
  securityGroup: vpcStack.securityGroup,
  authorizer: apiStack.authorizer,
})

new ListPurchasesStack(app, "ListPurchasesStack", {
  apiEndpoint: apiStack.apiEndpoint,
  vpc: vpcStack.vpc,
  securityGroup: vpcStack.securityGroup,
  authorizer: apiStack.authorizer,
})

new ListStoresStack(app, "ListStoresStack", {
  apiEndpoint: apiStack.apiEndpoint,
  vpc: vpcStack.vpc,
  securityGroup: vpcStack.securityGroup,
  authorizer: apiStack.authorizer,
})

new ListReceiptsStack(app, "ListReceiptsStack", {
  apiEndpoint: apiStack.apiEndpoint,
  vpc: vpcStack.vpc,
  securityGroup: vpcStack.securityGroup,
  authorizer: apiStack.authorizer,
})

new LoginShopperStack(app, "LoginShopperStack", {
  apiEndpoint: apiStack.apiEndpoint,
  vpc: vpcStack.vpc,
  securityGroup: vpcStack.securityGroup,
})

new RegisterShopperStack(app, "RegisterShopperStack", {
  apiEndpoint: apiStack.apiEndpoint,
  vpc: vpcStack.vpc,
  securityGroup: vpcStack.securityGroup,
})

new ResendConfirmationStack(app, "ResendConfirmationStack", {
  apiEndpoint: apiStack.apiEndpoint,
  vpc: vpcStack.vpc,
  securityGroup: vpcStack.securityGroup,
})

new ReviewActivityStack(app, "ReviewActivityStack", {
  apiEndpoint: apiStack.apiEndpoint,
  vpc: vpcStack.vpc,
  securityGroup: vpcStack.securityGroup,
  authorizer: apiStack.authorizer,
})

new ShowAccountDashboardStack(app, "ShowAccountDashboardStack", {
  apiEndpoint: apiStack.apiEndpoint,
  vpc: vpcStack.vpc,
  securityGroup: vpcStack.securityGroup,
  authorizer: apiStack.authorizer,
})


// "Master" lambda function stack
// const lambdaStack = new LambdaStack(app, "LambdaStack", {
//   userPool: authorizationStack.userPool  // Pass User Pool here
//   /* If you don't specify 'env', this stack will be environment-agnostic.
//    * Account/Region-dependent features and context lookups will not work,
//    * but a single synthesized template can be deployed anywhere. */
//
//   /* Uncomment the next line to specialize this stack for the AWS Account
//    * and Region that are implied by the current CLI configuration. */
//   // env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
//
//   /* Uncomment the next line if you know exactly what Account and Region you
//    * want to deploy the stack to. */
//   // env: { account: '123456789012', region: 'us-east-1' },
//
//   /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
// });

// Dev stacks

// new AndrewStack(app, "AndrewStack", {
//   apiEndpoint: lambdaStack.apiEndpoint,
//   vpc: lambdaStack.vpc,
//   securityGroup: lambdaStack.securityGroup,
// })
//
// new OwenStack(app, "OwenStack", {
//   apiEndpoint: lambdaStack.apiEndpoint,
//   vpc: lambdaStack.vpc,
//   securityGroup: lambdaStack.securityGroup,
// })
//
// new RyanStack(app, "RyanStack", {
//   apiEndpoint: lambdaStack.apiEndpoint,
//   vpc: lambdaStack.vpc,
//   securityGroup: lambdaStack.securityGroup,
// })
//
// new ThomasStack(app, "ThomasStack", {
//   apiEndpoint: lambdaStack.apiEndpoint,
//   vpc: lambdaStack.vpc,
//   securityGroup: lambdaStack.securityGroup,
//   authorizer: lambdaStack.authorizer,
// })
//
