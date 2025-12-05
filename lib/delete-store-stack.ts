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

interface DeleteStoreStackProps extends cdk.StackProps {
  apiEndpoint: apigw.RestApi,
  vpc: ec2.IVpc,
  securityGroup: ec2.ISecurityGroup,
  authorizer: apigw.IAuthorizer,
}

export class DeleteStoreStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: DeleteStoreStackProps) {
    super(scope, id, props)

    // BEGIN: /chains/{chainId}/stores/{storeId} endpoint

    const deleteStoreFn = new lambdaNodejs.NodejsFunction(this, "deleteStore", {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: "deleteStore.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "deleteStore")),
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

    storeIdResource.addMethod("DELETE", new apigw.LambdaIntegration(deleteStoreFn), {
      authorizer: props!.authorizer,
      authorizationType: apigw.AuthorizationType.COGNITO,
    })

    // END: /chains/{chainId}/stores/{storeId} endpoint
  }
}
