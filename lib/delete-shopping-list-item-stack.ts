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

interface DeleteShoppingListItemStackProps extends cdk.StackProps {
  apiEndpoint: apigw.RestApi,
  vpc: ec2.IVpc,
  securityGroup: ec2.ISecurityGroup,
  authorizer: apigw.IAuthorizer,
}

export class DeleteShoppingListItemStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: DeleteShoppingListItemStackProps) {
    super(scope, id, props)

    // BEGIN: /shopping_lists/{shoppingListID}/items/{itemID} endpoint

    const deleteShoppingListItemFn = new lambdaNodejs.NodejsFunction(this, "deleteShoppingListItem", {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: "deleteShoppingListItem.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "deleteShoppingListItem")),
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
    const shoppingListResource = props!.apiEndpoint.root.getResource("shopping_lists")
      ?? props!.apiEndpoint.root.addResource("shopping_lists")

    // /shopping_lists/{shoppingListID}
    const shoppingListIDResource = shoppingListResource.getResource("{shoppingListID}")
      ?? shoppingListResource.addResource("{shoppingListID}")

    // /shopping_lists/{shoppingListID}/items
    const itemsResource = shoppingListIDResource.getResource("items")
      ?? shoppingListIDResource.addResource("items")

    // /shopping_lists/{shoppingListID}/items{itemID}
    const itemIDResource = itemsResource.getResource("{itemID}")
      ?? itemsResource.addResource("{itemID}")

      itemIDResource.addMethod("DELETE", new apigw.LambdaIntegration(deleteShoppingListItemFn), {
      authorizer: props!.authorizer,
      authorizationType: apigw.AuthorizationType.COGNITO
    })

    // END: /shopping_lists/{shoppingListID}/items/{itemID} endpoint
  }
}
