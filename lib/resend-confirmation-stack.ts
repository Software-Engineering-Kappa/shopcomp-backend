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

interface ResendConfirmationStackProps extends cdk.StackProps {
  apiEndpoint: apigw.RestApi,
  vpc: ec2.IVpc,
  securityGroup: ec2.ISecurityGroup,
}

export class ResendConfirmationStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: ResendConfirmationStackProps) {
    super(scope, id, props)

    // BEGIN: /shopper/resend_code endpoint

    const resendConfirmationFn = new lambdaNodejs.NodejsFunction(this, "resendConfirmation", {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: "resendConfirmation.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "resendConfirmation")),
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

    // /shoper/resend_confirmation
    const resendConfirmationResource = shopperResource.getResource("resend_confirmation")
      ?? shopperResource.addResource("resend_confirmation")

    resendConfirmationResource.addMethod(
      "POST",
      new apigw.LambdaIntegration(resendConfirmationFn),
    )

    // END: /shopper/resend_code endpoint
  }
}
