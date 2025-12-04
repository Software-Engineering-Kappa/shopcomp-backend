import * as cdk from "aws-cdk-lib"
import { Construct } from "constructs"
import * as apigw from "aws-cdk-lib/aws-apigateway"
import * as ec2 from "aws-cdk-lib/aws-ec2"
import * as lambda from "aws-cdk-lib/aws-lambda"
import * as lambdaNodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as path from "node:path"
import { Duration } from "aws-cdk-lib/core"
// import * as Cognito from "aws-cdk-lib/aws-cognito"

// Load environment variables in `.env` file
import * as dotenv from "dotenv"
dotenv.config()

interface ListShoppingListsStackProps extends cdk.StackProps {
    apiEndpoint: apigw.RestApi,
    vpc: ec2.IVpc,
    securityGroup: ec2.ISecurityGroup,
    authorizer: apigw.IAuthorizer,
}

export class ListShoppingListsStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: ListShoppingListsStackProps) {
        super(scope, id, props)

        // -------------- /shopping_lists endpoint --------------
        const listShoppingListsFn = new lambdaNodejs.NodejsFunction(this, "listShoppingLists", {
            runtime: lambda.Runtime.NODEJS_22_X,
            handler: "listShoppingLists.handler",
            code: lambda.Code.fromAsset(path.join(__dirname, "listShoppingLists")),
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

        // /shopping_lists
        const shoppingListsResource = props!.apiEndpoint.root.getResource("shopping_lists")
            ?? props!.apiEndpoint.root.addResource("shopping_lists");

        shoppingListsResource.addMethod("GET", new apigw.LambdaIntegration(listShoppingListsFn), {
            authorizer: props!.authorizer,
            authorizationType: apigw.AuthorizationType.COGNITO
        });
        // ------------------------------------------------
    }
}