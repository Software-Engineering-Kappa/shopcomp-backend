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

interface AddItemToReceiptStackProps extends cdk.StackProps {
  apiEndpoint: apigw.RestApi,
  vpc: ec2.IVpc,
  securityGroup: ec2.ISecurityGroup,
  authorizer: apigw.IAuthorizer,
}

export class AddItemToReceiptStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: AddItemToReceiptStackProps) {
    super(scope, id, props)

    // BEGIN: /receipts/{receiptId}/items endpoint

    const addItemToReceiptFn = new lambdaNodejs.NodejsFunction(this, "addItemToReceipt", {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: "addItemToReceipt.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "addItemToReceipt")),
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

    // /receipts
    const receiptsResource = props!.apiEndpoint.root.getResource("receipts")
      ?? props!.apiEndpoint.root.addResource("receipts")

    // /receipts/{receiptId}
    const receiptIdResource = receiptsResource.getResource("{receiptId}")
      ?? receiptsResource.addResource("{receiptId}")

    // /receipts/{receiptId}/items
    const itemsResource = receiptIdResource.getResource("items")
      ?? receiptIdResource.addResource("items")

    itemsResource.addMethod("POST", new apigw.LambdaIntegration(addItemToReceiptFn), {
      authorizer: props!.authorizer,
      authorizationType: apigw.AuthorizationType.COGNITO
    })

    // BEGIN: /receipts/{receiptId}/items endpoint
  }
}
