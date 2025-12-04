import * as cdk from "aws-cdk-lib"
import { Construct } from "constructs"
import * as apigw from "aws-cdk-lib/aws-apigateway"
import * as ec2 from "aws-cdk-lib/aws-ec2"
import * as lambda from "aws-cdk-lib/aws-lambda"
import * as lambdaNodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as path from "node:path"
import { Duration } from "aws-cdk-lib/core"

// Load environment variables in `.env` file
import * as dotenv from "dotenv"
dotenv.config()

interface ListPurchasesStackProps extends cdk.StackProps {
    apiEndpoint: apigw.RestApi,
    vpc: ec2.IVpc,
    securityGroup: ec2.ISecurityGroup,
    authorizer: apigw.IAuthorizer,
}

export class ListPurchasesStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: ListPurchasesStackProps) {
        super(scope, id, props)

        // -------------- /purchases endpoint --------------
        const listPurchasesFn = new lambdaNodejs.NodejsFunction(this, "listPurchases", {
            runtime: lambda.Runtime.NODEJS_22_X,
            handler: "listPurchases.handler",
            code: lambda.Code.fromAsset(path.join(__dirname, "listPurchases")),
            vpc: props!.vpc,
            securityGroups: [props!.securityGroup],
            timeout: Duration.seconds(3),
            environment: {
                LOG_USER_POOL_CLIENT_ID: process.env.USER_POOL_CLIENT_ID ?? "",
                DB_HOST: process.env.DB_HOST ?? "",
                DB_USER: process.env.DB_USER ?? "",
                DB_PASSWORD: process.env.DB_PASSWORD ?? "",
                DB_NAME: process.env.DB_NAME ?? "",
            }
        });

        const purchasesResource = props!.apiEndpoint.root.getResource("purchases")
            ?? props!.apiEndpoint.root.addResource("purchases");

        purchasesResource.addMethod("GET", new apigw.LambdaIntegration(listPurchasesFn), {
            authorizer: props!.authorizer,
            authorizationType: apigw.AuthorizationType.COGNITO
        });
        // ------------------------------------------------
    }
}