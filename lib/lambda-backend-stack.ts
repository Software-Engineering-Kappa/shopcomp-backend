import * as cdk from "aws-cdk-lib"
import { Construct } from "constructs"
import * as apigw from "aws-cdk-lib/aws-apigateway"
import * as lambda from "aws-cdk-lib/aws-lambda"
import * as lambdaNodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as path from "node:path"
import * as ec2 from "aws-cdk-lib/aws-ec2"
import { Duration } from "aws-cdk-lib"

// Load environment variables in `.env` file
import * as dotenv from "dotenv"
dotenv.config()


/**
 * Stack that contains the API Gateway and Lambda Functions
 */
export class LambdaStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    // Import VPC
    const vpc = ec2.Vpc.fromVpcAttributes(this, "VPC", {
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
    const securityGroup = ec2.SecurityGroup.fromSecurityGroupId(this, "SG",
      "sg-0df434762caae7a53",
      { mutable: false }
    )


    // Default Lambda function located in lib/default/default.mjs
    const default_fn = new lambdaNodejs.NodejsFunction(this, "DefaultFunction", {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: "default.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "default")),
      vpc: vpc,
      securityGroups: [securityGroup],
      timeout: Duration.seconds(3),
    })


    // REST API Gateway configuration
    const apiEndpoint = new apigw.LambdaRestApi(this, "shopcompapi", {
      handler: default_fn,
      restApiName: "ShopcompAPI",      // Name that appears in API Gateway page
      proxy: false,

      // Recommended: CORS config
      defaultCorsPreflightOptions: {
        allowOrigins: apigw.Cors.ALL_ORIGINS,
        allowMethods: apigw.Cors.ALL_METHODS,
      },
    })

    // Create top-level API resources here
    const shopperResource = apiEndpoint.root.addResource("shopper")

    const integrationParameters = {
      proxy: false,
      passthroughBehavior: apigw.PassthroughBehavior.WHEN_NO_MATCH,

      integrationResponses: [
        {
          statusCode: "200",
          responseTemplates: {
            "application/json": "$input.json(\'$\')",
          },
          responseParameters: {
            "method.response.header.Content-Type": "'application/json'",
            "method.response.header.Access-Control-Allow-Origin": "'*'",
            "method.response.header.Access-Control-Allow-Credentials": "'true'"
          },
        },
        {
          selectionPattern: "(\n|.)+",
          statusCode: "400",
          responseTemplates: {
            "application/json": JSON.stringify({
              state: "error",
              message: "$util.escapeJavaScript($input.path('$.errorMessage'))"
            })
          },
          responseParameters: {
            "method.response.header.Content-Type": "'application/json'",
            "method.response.header.Access-Control-Allow-Origin": "'*'",
            "method.response.header.Access-Control-Allow-Credentials": "'true'"
          },
        }
      ]
    }

    const responseParameters = {
      methodResponses: [
        {
          // Successful response from the integration
          statusCode: "200",
          // Define what parameters are allowed or not
          responseParameters: {
            "method.response.header.Content-Type": true,
            "method.response.header.Access-Control-Allow-Origin": true,
            "method.response.header.Access-Control-Allow-Credentials": true
          },
        },
        {
          // Same thing for the error responses
          statusCode: "400",
          responseParameters: {
            "method.response.header.Content-Type": true,
            "method.response.header.Access-Control-Allow-Origin": true,
            "method.response.header.Access-Control-Allow-Credentials": true
          },
        }
      ]
    }

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
      vpc: vpc,
      securityGroups: [securityGroup],
      timeout: Duration.seconds(3),
      environment: {
        USER_POOL_CLIENT_ID: process.env.USER_POOL_CLIENT_ID!,
      },
    })

    const shopperLoginResource = shopperResource.addResource("register")
    shopperLoginResource.addMethod(
      "POST",
      new apigw.LambdaIntegration(registerShopperFn, integrationParameters),
      responseParameters
    )

    // END: /shopper/register endpoint
  }
}
