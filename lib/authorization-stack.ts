import * as cdk from "aws-cdk-lib"
import { Construct } from "constructs"
import * as apigw from "aws-cdk-lib/aws-apigateway"
import * as cognito from "aws-cdk-lib/aws-cognito"

export class AuthorizationStack extends cdk.Stack {
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;
  public readonly authorizer: apigw.CognitoUserPoolsAuthorizer;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    // Construct the user pool
    this.userPool = new cognito.UserPool(this, "ShopCompPool", {
      userPoolName: "ShopComp-pool",
      signInCaseSensitive: false,       // case insensitive for username and email
      selfSignUpEnabled: true,

      // User can sign in with username or email
      signInAliases: {
        username: true,
        email: true,
      },

      // Verification email is sent after signing up
      autoVerify: {
        email: true,
      },
      userVerification: {
        emailSubject: "Verify your email for ShopComp",
        emailBody: "Thanks for signing up to ShopComp! Your verification code is {####}",
        emailStyle: cognito.VerificationEmailStyle.CODE,
      },

      standardAttributes: {
        email: {
          required: true,
          mutable: true,
        }
      },

      // Password policy
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false,
      },

      // Allow password reset via email
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
    })

    // Add shopper and admin groups
    this.userPool.addGroup("Shopper", {
      groupName: "Shopper-group"
    })

    this.userPool.addGroup("Admin", {
      groupName: "Admin-group"
    })

    // Create client for this user pool
    this.userPoolClient = this.userPool.addClient("Client", {
      authFlows: {
        userPassword: true,
      },
    })

    // Output the client id when you run `cdk deploy`
    new cdk.CfnOutput(this, "ClientIdOutput", {
      key: "ShopCompPoolClientId",
      value: this.userPoolClient.userPoolClientId,
    })
  }
}
