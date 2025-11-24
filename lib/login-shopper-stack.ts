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

interface LoginShopperStackProps extends cdk.StackProps {
  apiEndpoint: apigw.RestApi,
  vpc: ec2.IVpc,
  securityGroup: ec2.ISecurityGroup,
}

export class LoginShopperStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: LoginShopperStackProps) {
    super(scope, id, props)

    // BEGIN: /shopper/login endpoint

    const loginShopperFn = new lambdaNodejs.NodejsFunction(this, "loginShopper", {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: "loginShopper.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "loginShopper")),
      vpc: props!.vpc,
      securityGroups: [props!.securityGroup],
      timeout: Duration.seconds(3),
      environment: {
        USER_POOL_CLIENT_ID: process.env.USER_POOL_CLIENT_ID!,
      },
    })

    const shopperResource = props!.apiEndpoint.root.getResource("shopper")
      ?? props!.apiEndpoint.root.addResource("shopper")

    const loginResource = shopperResource.getResource("login")
      ?? shopperResource.addResource("login")

    loginResource.addMethod(
      "POST",
      new apigw.LambdaIntegration(loginShopperFn),
    )

    // END: /shopper/login endpoint
  }
}
