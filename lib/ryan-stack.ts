import * as cdk from "aws-cdk-lib"
import { Construct } from "constructs"
import * as apigw from "aws-cdk-lib/aws-apigateway"
import * as ec2 from "aws-cdk-lib/aws-ec2"
import * as lambda from "aws-cdk-lib/aws-lambda"
import * as lambdaNodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as path from "node:path"
import { Duration } from "aws-cdk-lib"

interface RyanStackProps extends cdk.StackProps {
  apiEndpoint: apigw.RestApi,
  vpc: ec2.IVpc,
  securityGroup: ec2.ISecurityGroup,
}

export class RyanStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: RyanStackProps) {
    super(scope, id, props)

    const chainsResource = props!.apiEndpoint.root.getResource("chains")
                ?? props!.apiEndpoint.root.addResource("chains");

    const chainIdResource = chainsResource.getResource("{chainId}")
                ?? chainsResource.addResource("{chainId}");

    const storesResource = chainIdResource.getResource("stores")
                ?? chainIdResource.addResource("stores");


    // -------------- /chains/{chainId}/stores endpoint --------------
    const listStoresFn = new lambdaNodejs.NodejsFunction(this, "listStores", {
        runtime: lambda.Runtime.NODEJS_22_X,
        handler: "listStores.handler",
        code: lambda.Code.fromAsset(path.join(__dirname, "listStores")),
        vpc: props!.vpc,
        securityGroups: [props!.securityGroup],
        timeout: Duration.seconds(3),
        environment: {
            LOG_USER_POOL_CLIENT_ID: process.env.USER_POOL_CLIENT_ID!
        }
    });

    storesResource.addMethod("GET", new apigw.LambdaIntegration(listStoresFn));
    // ---------------------------------------------------------------
  }
}
