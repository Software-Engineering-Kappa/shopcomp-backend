import * as cdk from "aws-cdk-lib"
import { Construct } from "constructs"
import * as apigw from "aws-cdk-lib/aws-apigateway"
import * as lambda from "aws-cdk-lib/aws-lambda"
import * as lambdaNodejs from "aws-cdk-lib/aws-lambda-nodejs"
import * as path from "node:path"
import * as ec2 from "aws-cdk-lib/aws-ec2"
import { Duration } from "aws-cdk-lib"

// Load environment variables in `.env` file
import * as dotenv from "dotenv"
dotenv.config()

interface ListItemsOnShoppingListStackProps extends cdk.StackProps {
  apiEndpoint: apigw.RestApi,
  vpc: ec2.IVpc,
  securityGroup: ec2.ISecurityGroup,
  authorizer: apigw.IAuthorizer,
}

export class ListItemsOnShoppingListStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: ListItemsOnShoppingListStackProps) {
    super(scope, id, props)

    // BEGIN: /shopping_lists/{shoppingListID}/items endpoint

    const listItemsOnShoppingListFn = new lambdaNodejs.NodejsFunction(this, "listItemsOnShoppingList", {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: "listItemsOnShoppingList.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "listItemsOnShoppingList")),
      vpc: props!.vpc,
      securityGroups: [props!.securityGroup],
      timeout: Duration.seconds(3),
      environment: {
        DB_HOST: process.env.DB_HOST!,
        DB_USER: process.env.DB_USER!,
        DB_PASSWORD: process.env.DB_PASSWORD!,
        DB_NAME: process.env.DB_NAME!
      }
    })

    // /shopping_lists
    const shoppingListsResource = props!.apiEndpoint.root.getResource("shopping_lists")
      ?? props!.apiEndpoint.root.addResource("shopping_lists");

    // /shopping_lists/{shoppingListID}
    const shoppingListIDResource = shoppingListsResource.getResource("{shoppingListID}")
      ?? shoppingListsResource.addResource("{shoppingListID}")
    
    // /shopping_lists/{shoppingListId}/items
    const itemsResource = shoppingListIDResource.getResource("items")
      ?? shoppingListIDResource.addResource("items")

    itemsResource.addMethod("GET", new apigw.LambdaIntegration(listItemsOnShoppingListFn), {
      authorizer: props!.authorizer,
      authorizationType: apigw.AuthorizationType.COGNITO
    })

    // END: /shopping_lists/{shoppingListID}/items endpoint
  }
}
