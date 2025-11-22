import * as cdk from "aws-cdk-lib"
import { Construct } from "constructs"
import * as apigw from "aws-cdk-lib/aws-apigateway"
import * as ec2 from "aws-cdk-lib/aws-ec2"
import * as lambda from "aws-cdk-lib/aws-lambda"
import * as lambdaNodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as path from "node:path"
import { Duration } from "aws-cdk-lib"

interface ThomasStackProps extends cdk.StackProps {
  apiEndpoint: apigw.RestApi,
  vpc: ec2.IVpc,
  securityGroup: ec2.ISecurityGroup,
}

export class ThomasStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: ThomasStackProps) {
    super(scope, id, props)

    const dashboardResource = props!.apiEndpoint.root.getResource("dashboard")
      ?? props!.apiEndpoint.root.addResource("dashboard")


    // BEGIN: /shopper/dashboard endpoint

    const showDashboardFn = new lambdaNodejs.NodejsFunction(this, "showDashoard", {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: "showDashoard.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "showDashoard")),
      vpc: props!.vpc,
      securityGroups: [props!.securityGroup],
      timeout: Duration.seconds(3),
      environment: {
        LOG_USER_POOL_CLIENT_ID: process.env.USER_POOL_CLIENT_ID!
      }
    })

    dashboardResource.addMethod("GET", new apigw.LambdaIntegration(showDashboardFn));
    // END: /shopper/dashboard endpoint
  }
}
