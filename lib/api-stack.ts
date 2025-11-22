import * as cdk from "aws-cdk-lib"
import { Construct } from "constructs"
import * as apigw from "aws-cdk-lib/aws-apigateway"

export class ApiStack extends cdk.Stack {
  public readonly apiEndpoint: apigw.RestApi

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    // REST API Gateway configuration
    this.apiEndpoint = new apigw.RestApi(this, "shopcompapi", {
      restApiName: "ShopcompAPI",      // Name that appears in API Gateway page

      // Recommended: CORS config
      defaultCorsPreflightOptions: {
        allowOrigins: apigw.Cors.ALL_ORIGINS,
        allowMethods: apigw.Cors.ALL_METHODS,
      },
    })
  }
}
