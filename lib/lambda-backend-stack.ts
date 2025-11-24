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


    // Add lambda functions here!
    //  1. Copy `default_fn` declaration from above and use as template for a new Lambda function
    //  2. Use the code below as a template to create LambdaIntegration resources
    //
    // --- Template ---
    //
    // const resource = v1.getResource("resource") ??                        // Name resource
    //  v1.addResource("resource")                          
    //
    // resource.addMethod(
    //   "POST",                                                             // HTTP method
    //   new apigw.LambdaIntegration(default_fn, integration_parameters),    // REPLACE default_fn
    //   response_parameters
    // )
    //


  }
}
