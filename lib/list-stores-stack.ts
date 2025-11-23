import * as cdk from "aws-cdk-lib"
import { Construct } from "constructs"
import * as apigw from "aws-cdk-lib/aws-apigateway"
import * as lambda from "aws-cdk-lib/aws-lambda"
import * as lambdaNodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as path from "node:path"
import * as ec2 from "aws-cdk-lib/aws-ec2"
import { Duration } from "aws-cdk-lib"

// Load environment variables in `.env` file
import * as dotenv from "dotenv"
dotenv.config()

interface ListStoresStackProps extends cdk.StackProps {
  apiEndpoint: apigw.RestApi,
  vpc: ec2.IVpc,
  securityGroup: ec2.ISecurityGroup,
  authorizer: apigw.IAuthorizer,
}

export class ListStoresStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: ListStoresStackProps) {
    super(scope, id, props)

    // BEGIN: /chains/{chainId}/stores endpoint

    const listStoresFn = new lambdaNodejs.NodejsFunction(this, "listStores", {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: "listStores.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "listStores")),
      vpc: props!.vpc,
      securityGroups: [props!.securityGroup],
      timeout: Duration.seconds(3),
      environment: {
        USER_POOL_CLIENT_ID: process.env.USER_POOL_CLIENT_ID!,
        host: process.env.DB_HOST!,
        user: process.env.DB_USER!,
        password: process.env.DB_PASSWORD!,
        database: process.env.DB_NAME!
      }
    })

    // /chains
    const chainsResource = props!.apiEndpoint.root.getResource("chains")
      ?? props!.apiEndpoint.root.addResource("chains")

    // /chains/{chainId}
    const chainIdResource = chainsResource.getResource("{chainId}")
      ?? chainsResource.addResource("{chainId}")

    // /chains/{chainId}/stores
    const storesResource = chainIdResource.addResource("stores")

    storesResource.addMethod("GET", new apigw.LambdaIntegration(listStoresFn))

    // END: /chains/{chainId}/stores endpoint
  }
}
