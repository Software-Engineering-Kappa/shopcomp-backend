import * as cdk from "aws-cdk-lib"
import { Construct } from "constructs"

import * as cognito from "aws-cdk-lib/aws-cognito"

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
    })

    // Add shopper and admin groups
    this.userPool.addGroup("Shopper", {
      groupName: "Shopper-group"
    })

    this.userPool.addGroup("Admin", {
      groupName: "Admin-group"
    })

    // Create client for this user pool
    this.userPoolClient = this.userPool.addClient("Client")

    // Output the client id when you run `cdk deploy`
    new cdk.CfnOutput(this, "ClientIdOutput", {
      key: "ShopCompPoolClientId",
      value: this.userPoolClient.userPoolClientId,
    })
  }
}
