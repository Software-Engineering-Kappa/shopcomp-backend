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

    const showAccountDashboardFn = new lambdaNodejs.NodejsFunction(this, "showAccountDashboard", {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: "showAccountDashboard.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "showAccountDashboard")),
      vpc: props!.vpc,
      securityGroups: [props!.securityGroup],
      timeout: Duration.seconds(3),
      environment: {
        host: process.env.DB_HOST!,
        user: process.env.DB_USER!,
        password: process.env.DB_PASSWORD!,
        database: process.env.DB_NAME!
      }
    })

    dashboardResource.addMethod("GET", new apigw.LambdaIntegration(showAccountDashboardFn));
    // END: /shopper/dashboard endpoint
  }
}
