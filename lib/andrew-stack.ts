import * as cdk from "aws-cdk-lib"
import { Construct } from "constructs"
import * as apigw from "aws-cdk-lib/aws-apigateway"
import * as ec2 from "aws-cdk-lib/aws-ec2"
import * as lambda from "aws-cdk-lib/aws-lambda"
import * as lambdaNodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as path from "node:path"
import { Duration } from "aws-cdk-lib"

// Load environment variables in `.env` file
import * as dotenv from "dotenv"
dotenv.config()

interface AndrewStackProps extends cdk.StackProps {
  apiEndpoint: apigw.RestApi,
  vpc: ec2.IVpc,
  securityGroup: ec2.ISecurityGroup,
}

export class AndrewStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: AndrewStackProps) {
    super(scope, id, props)

    const shopperResource = props!.apiEndpoint.root.getResource("/shopper")
      ?? props!.apiEndpoint.root.addResource("/shopper")

    // BEGIN: /shopper/resend_code endpoint

    const resendConfirmationFn = new lambdaNodejs.NodejsFunction(this, "resendConfirmation", {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: "resendConfirmation.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "confirmShopper")),
      vpc: props!.vpc,
      securityGroups: [props!.securityGroup],
      timeout: Duration.seconds(3),
      environment: {
        USER_POOL_CLIENT_ID: process.env.USER_POOL_CLIENT_ID!,
      },
    })

    const resendConfirmationResource = shopperResource.addResource("confirm")
    resendConfirmationResource.addMethod(
      "POST",
      new apigw.LambdaIntegration(resendConfirmationFn),
    )

    // END: /shopper/resend_code endpoint
  }
}
