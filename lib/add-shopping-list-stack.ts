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

interface AddShoppingListStackProps extends cdk.StackProps {
    apiEndpoint: apigw.RestApi,
    vpc: ec2.IVpc,
    securityGroup: ec2.ISecurityGroup,
    authorizer: apigw.IAuthorizer,
}

export class AddShoppingListStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: AddShoppingListStackProps) {
        super(scope, id, props)

        // -------------- /shopping_lists endpoint --------------
        const addShoppingListFn = new lambdaNodejs.NodejsFunction(this, "addShoppingList", {
            runtime: lambda.Runtime.NODEJS_22_X,
            handler: "addShoppingList.handler",
            code: lambda.Code.fromAsset(path.join(__dirname, "addShoppingList")),
            vpc: props!.vpc,
            securityGroups: [props!.securityGroup],
            timeout: Duration.seconds(3),
            environment: {
                DB_HOST: process.env.DB_HOST ?? "",
                DB_USER: process.env.DB_USER ?? "",
                DB_PASSWORD: process.env.DB_PASSWORD ?? "",
                DB_NAME: process.env.DB_NAME ?? "",
            }
        });

        // /shopping_lists
        const shoppingListsResource = props!.apiEndpoint.root.getResource("shopping_lists")
            ?? props!.apiEndpoint.root.addResource("shopping_lists");

        shoppingListsResource.addMethod("POST", new apigw.LambdaIntegration(addShoppingListFn), {
            authorizer: props!.authorizer,
            authorizationType: apigw.AuthorizationType.COGNITO
        });
        // ------------------------------------------------
    }
}