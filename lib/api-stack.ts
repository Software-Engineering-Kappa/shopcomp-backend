import * as cdk from "aws-cdk-lib"
import { Construct } from "constructs"
import * as apigw from "aws-cdk-lib/aws-apigateway"
import * as cognito from "aws-cdk-lib/aws-cognito"

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
      defaultCorsPreflightOptions: {
        allowOrigins: apigw.Cors.ALL_ORIGINS,
        allowMethods: apigw.Cors.ALL_METHODS,
      },
    })

    // Create authorizer for this user pool
    this.authorizer = new apigw.CognitoUserPoolsAuthorizer(this, 'Authorizer', {
      cognitoUserPools: [props!.userPool]
    })

  }
}
