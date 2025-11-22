import * as cdk from "aws-cdk-lib"
import { Construct } from "constructs"
import * as apigw from "aws-cdk-lib/aws-apigateway"
import * as ec2 from "aws-cdk-lib/aws-ec2"
import * as lambda from "aws-cdk-lib/aws-lambda"
import * as lambdaNodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as path from "node:path"
import { Duration } from "aws-cdk-lib/core"
import * as Cognito from "aws-cdk-lib/aws-cognito"

// Load environment variables in `.env` file
import * as dotenv from "dotenv"
dotenv.config()

interface ListChainsStackProps extends cdk.StackProps {
  apiEndpoint: apigw.RestApi,
  vpc: ec2.IVpc,
  securityGroup: ec2.ISecurityGroup,
  authorizer: apigw.IAuthorizer,
}

export class ListChainsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: ListChainsStackProps) {
    super(scope, id, props)

    const chainsResource = props!.apiEndpoint.root.getResource("chains")
      ?? props!.apiEndpoint.root.addResource("chains");

    // -------------- /chains endpoint --------------
    const listChainsFn = new lambdaNodejs.NodejsFunction(this, "listChains", {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: "listChains.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "listChains")),
      vpc: props!.vpc,
      securityGroups: [props!.securityGroup],
      timeout: Duration.seconds(3),
      environment: {
        LOG_USER_POOL_CLIENT_ID: process.env.USER_POOL_CLIENT_ID ?? "",
        DB_HOST: process.env.RDS_HOST ?? "",
        DB_USER: process.env.RDS_USER ?? "",
        DB_PASSWORD: process.env.RDS_PASSWORD ?? "",
        DB_DATABASE: process.env.RDS_DATABASE ?? "",
      }
    });

    chainsResource.addMethod("GET", new apigw.LambdaIntegration(listChainsFn));
    // ---------------------------------------------------------------
  }
}