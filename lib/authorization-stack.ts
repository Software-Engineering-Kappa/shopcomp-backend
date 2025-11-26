import * as cdk from "aws-cdk-lib"
import { Construct } from "constructs"
import * as cognito from "aws-cdk-lib/aws-cognito"
import * as lambda from "aws-cdk-lib/aws-lambda"
import * as lambdaNodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as path from "node:path"
import { Duration } from "aws-cdk-lib"
import * as iam from "aws-cdk-lib/aws-iam"

export class AuthorizationStack extends cdk.Stack {
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;

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

    // Lambda function to add new users to the "Shopper-group" group
    const postConfirmationFn = new lambdaNodejs.NodejsFunction(this, "postConfirmationAssignGroup", {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: "postConfirmationAssignGroup.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "postConfirmationAssignGroup")),
      timeout: Duration.seconds(3),
    })

    // Granting permission for the lambda function to change user groups
    postConfirmationFn.addToRolePolicy(new iam.PolicyStatement({
      actions: ["cognito-idp:AdminAddUserToGroup"],
      // resources: [this.userPool.userPoolArn],
      resources: ["*"],
    }))

    this.userPool.addTrigger(
      cognito.UserPoolOperation.POST_CONFIRMATION,
      postConfirmationFn,
    )

    // Output the client id when you run `cdk deploy`
    new cdk.CfnOutput(this, "ClientIdOutput", {
      key: "ShopCompPoolClientId",
      value: this.userPoolClient.userPoolClientId,
    })
  }
}
