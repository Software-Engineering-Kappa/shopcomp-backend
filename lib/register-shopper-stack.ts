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

interface RegisterShopperStackProps extends cdk.StackProps {
  apiEndpoint: apigw.RestApi,
  vpc: ec2.IVpc,
  securityGroup: ec2.ISecurityGroup,
}

export class RegisterShopperStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: RegisterShopperStackProps) {
    super(scope, id, props)

    // BEGIN: /shopper/register endpoint

    const registerShopperFn = new lambdaNodejs.NodejsFunction(this, "registerShopper", {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: "registerShopper.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "registerShopper")),
      vpc: props!.vpc,
      securityGroups: [props!.securityGroup],
      timeout: Duration.seconds(3),
      environment: {
        USER_POOL_CLIENT_ID: process.env.USER_POOL_CLIENT_ID!,
      },
    })

    // /shopper
    const shopperResource = props!.apiEndpoint.root.getResource("shopper")
      ?? props!.apiEndpoint.root.addResource("shopper")

    // /shoper/register
    const shopperLoginResource = shopperResource.getResource("register")
      ?? shopperResource.addResource("register")

    shopperLoginResource.addMethod(
      "POST",
      new apigw.LambdaIntegration(registerShopperFn),
    )

    // END: /shopper/register endpoint
  }
}
