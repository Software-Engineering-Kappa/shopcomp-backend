import * as cdk from "aws-cdk-lib"
import { Construct } from "constructs"
import * as apigw from "aws-cdk-lib/aws-apigateway"
import * as lambda from "aws-cdk-lib/aws-lambda"
import * as lambdaNodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as path from "node:path"
import * as ec2 from "aws-cdk-lib/aws-ec2"
import { Duration } from "aws-cdk-lib"
import * as cognito from "aws-cdk-lib/aws-cognito"

// Load environment variables in `.env` file
import * as dotenv from "dotenv"
dotenv.config()

interface LambdaStackProps extends cdk.StackProps {
  userPool: cognito.IUserPool  // Add this
}

/**
 * Stack that contains the API Gateway and production-ready Lambda Functions
 */
export class LambdaStack extends cdk.Stack {
  public readonly apiEndpoint: apigw.RestApi
  public readonly vpc: ec2.IVpc
  public readonly securityGroup: ec2.ISecurityGroup
  public readonly authorizer: apigw.CognitoUserPoolsAuthorizer
  public readonly userPool: cognito.IUserPool

  constructor(scope: Construct, id: string, props: LambdaStackProps) { 
    super(scope, id, props)
    this.userPool = props.userPool

    // Import VPC
    this.vpc = ec2.Vpc.fromVpcAttributes(this, "VPC", {
      vpcId: "vpc-00af27809d4ee6d0e",

      availabilityZones: [
        "us-east-1a",
        "us-east-1b",
        "us-east-1c"
      ],

      privateSubnetIds: [
        "subnet-01c9945aed1421e38",
        "subnet-06b6d3060c96ee6f4",
        "subnet-00da31b049de1eacb",
      ],
    })

    // Import security group
    this.securityGroup = ec2.SecurityGroup.fromSecurityGroupId(this, "SG",
      "sg-0df434762caae7a53",
      { mutable: false }
    )

    // Default Lambda function located in lib/default/default.mjs
    const default_fn = new lambdaNodejs.NodejsFunction(this, "DefaultFunction", {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: "default.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "default")),
      vpc: this.vpc,
      securityGroups: [this.securityGroup],
      timeout: Duration.seconds(3),
    })

    this.authorizer = new apigw.CognitoUserPoolsAuthorizer(this, 'Authorizer', {
      cognitoUserPools: [this.userPool]
    })

    // Create top-level API resources here
    const shopperResource = this.apiEndpoint.root.addResource("shopper")

    // Add lambda functions here!
    //  1. Copy `default_fn` declaration from above and use as template for a new Lambda function
    //  2. Use the code below as a template to create LambdaIntegration resources
    //
    // --- Template ---
    //
    // const resource = v1.addResource("resource")                           // Name resource
    // resource.addMethod(
    //   "POST",                                                             // HTTP method
    //   new apigw.LambdaIntegration(default_fn, integration_parameters),    // REPLACE default_fn
    //   response_parameters
    // )
    //

    // BEGIN: /shopper/register endpoint

    const registerShopperFn = new lambdaNodejs.NodejsFunction(this, "registerShopper", {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: "registerShopper.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "registerShopper")),
      vpc: this.vpc,
      securityGroups: [this.securityGroup],
      timeout: Duration.seconds(3),
      environment: {
        USER_POOL_CLIENT_ID: process.env.USER_POOL_CLIENT_ID!,
      },
    })

    const shopperLoginResource = shopperResource.addResource("register")
    shopperLoginResource.addMethod(
      "POST",
      new apigw.LambdaIntegration(registerShopperFn),
    )

    // END: /shopper/register endpoint

    // BEGIN: /shopper/confirm endpoint

    const confirmShopperFn = new lambdaNodejs.NodejsFunction(this, "confirmShopper", {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: "confirmShopper.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "confirmShopper")),
      vpc: this.vpc,
      securityGroups: [this.securityGroup],
      timeout: Duration.seconds(3),
      environment: {
        USER_POOL_CLIENT_ID: process.env.USER_POOL_CLIENT_ID!,
      },
    })

    const shopperConfirmResource = shopperResource.addResource("confirm")
    shopperConfirmResource.addMethod(
      "POST",
      new apigw.LambdaIntegration(confirmShopperFn),
    )

    // END: /shopper/confirm endpoint
  }
}
