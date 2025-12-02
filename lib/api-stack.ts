import * as cdk from "aws-cdk-lib"
import { Construct } from "constructs"
import * as apigw from "aws-cdk-lib/aws-apigateway"
import * as cognito from "aws-cdk-lib/aws-cognito"
import * as lambda from "aws-cdk-lib/aws-lambda"
import * as lambdaNodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as path from "node:path"
import { Duration } from "aws-cdk-lib"

interface ApiStackProps extends cdk.StackProps {
  userPool: cognito.UserPool,
}

export class ApiStack extends cdk.Stack {
  public readonly apiEndpoint: apigw.RestApi
  public readonly authorizer: apigw.CognitoUserPoolsAuthorizer;

  constructor(scope: Construct, id: string, props?: ApiStackProps) {
    super(scope, id, props)

    // REST API Gateway configuration
    this.apiEndpoint = new apigw.RestApi(this, "shopcompapi", {
      restApiName: "ShopcompAPI",      // Name that appears in API Gateway page

      // Recommended: CORS config
      // defaultCorsPreflightOptions: {
      //   allowOrigins: [
      //     "http://localhost:3000",    // local development
      //     "http://localhost:3001",    // local development
      //     "http://shop-comp-s3-bucket.s3-website-us-east-1.amazonaws.com"
      //   ],
      //   allowCredentials: true,
      //   allowMethods: apigw.Cors.ALL_METHODS,
      //   allowHeaders: apigw.Cors.DEFAULT_HEADERS,
      // },
      // defaultCorsPreflightOptions: undefined,
    })

    // Create authorizer for this user pool
    this.authorizer = new apigw.CognitoUserPoolsAuthorizer(this, 'Authorizer', {
      cognitoUserPools: [props!.userPool]
    })

    // Function to handle all OPTIONS requests for CORS preflight
    const optionsHandler = new lambdaNodejs.NodejsFunction(this, "optionsHandler", {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: "optionsHandler.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "optionsHandler")),
      timeout: Duration.seconds(3),
    })

    // Make optionsHandler handle OPTIONS for all paths
    this.apiEndpoint.root
      .addResource("{proxy+}")
      .addMethod("OPTIONS", new apigw.LambdaIntegration(optionsHandler))

    // Add OPTIONS handler for the root itself
    this.apiEndpoint.root.addMethod("OPTIONS", new apigw.LambdaIntegration(optionsHandler))

    // Make error responses still have CORS headers
    // this.apiEndpoint.addGatewayResponse("cors4xx", {
    //   type: apigw.ResponseType.DEFAULT_4XX,
    //   responseHeaders: {
    //     "Access-Control-Allow-Origin": "method.request.header.origin",
    //     "Access-Control-Allow-Credentials": "'true'",
    //   },
    // });
    //
    // this.apiEndpoint.addGatewayResponse("cors5xx", {
    //   type: apigw.ResponseType.DEFAULT_5XX,
    //   responseHeaders: {
    //     "Access-Control-Allow-Origin": "method.request.header.origin",
    //     "Access-Control-Allow-Credentials": "'true'",
    //   },
    // });
  }
}
