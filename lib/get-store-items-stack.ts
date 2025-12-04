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

interface GetStoreItemsStackProps extends cdk.StackProps {
  apiEndpoint: apigw.RestApi,
  vpc: ec2.IVpc,
  securityGroup: ec2.ISecurityGroup,
  authorizer: apigw.IAuthorizer,
}

export class GetStoreItemsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: GetStoreItemsStackProps) {
    super(scope, id, props)

    // BEGIN: /chains/{chainId}/stores/{storeId}/items endpoint

    const getStoreItemsFn = new lambdaNodejs.NodejsFunction(this, "getStoreItems", {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: "getStoreItems.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "getStoreItems")),
      vpc: props!.vpc,
      securityGroups: [props!.securityGroup],
      timeout: Duration.seconds(3),
      environment: {
        DB_HOST: process.env.DB_HOST!,
        DB_USER: process.env.DB_USER!,
        DB_PASSWORD: process.env.DB_PASSWORD!,
        DB_NAME: process.env.DB_NAME!,
      }
    })

    // /chains
    const chainsResource = props!.apiEndpoint.root.getResource("chains")
      ?? props!.apiEndpoint.root.addResource("chains")

    // /chains/{chainId}
    const chainIdResource = chainsResource.getResource("{chainId}")
      ?? chainsResource.addResource("{chainId}")

    // /chains/{chainId}/stores
    const storesResource = chainIdResource.getResource("stores")
      ?? chainIdResource.addResource("stores")

    // /chains/{chainId}/stores/{storeId}
    const storeIdResource = storesResource.getResource("{storeId}")
      ?? storesResource.addResource("{storeId}")

    // /chains/{chainId}/stores/{storeId}/items
    const itemsResource = storeIdResource.getResource("items")
      ?? storeIdResource.addResource("items")

    // TODO: add authorizer
    itemsResource.addMethod("GET", new apigw.LambdaIntegration(getStoreItemsFn), {
      authorizer: props!.authorizer,
      authorizationType: apigw.AuthorizationType.COGNITO,
    })

    // BEGIN: /chains/{chainId}/stores/{storeId}/items endpoint
  }
}
