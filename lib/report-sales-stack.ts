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

interface ReportSalesStackProps extends cdk.StackProps {
  apiEndpoint: apigw.RestApi,
  vpc: ec2.IVpc,
  securityGroup: ec2.ISecurityGroup,
  authorizer: apigw.IAuthorizer,
}

export class ReportSalesStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: ReportSalesStackProps) {
    super(scope, id, props)

    // BEGIN: /sales endpoint

    const reportSalesFn = new lambdaNodejs.NodejsFunction(this, "reportSales", {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: "reportSales.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "reportSales")),
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

    // /sales
    const salesResource = props!.apiEndpoint.root.getResource("sales")
      ?? props!.apiEndpoint.root.addResource("sales")

    salesResource.addMethod("GET", new apigw.LambdaIntegration(reportSalesFn), {
      authorizer: props!.authorizer,
      authorizationType: apigw.AuthorizationType.COGNITO,
    })

    // END: /sales endpoint
  }
}
