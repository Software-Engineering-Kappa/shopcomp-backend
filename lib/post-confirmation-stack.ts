import * as cdk from "aws-cdk-lib"
import { Construct } from "constructs"
import * as lambda from "aws-cdk-lib/aws-lambda"
import * as lambdaNodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as path from "node:path"
import * as ec2 from "aws-cdk-lib/aws-ec2"
import { Duration } from "aws-cdk-lib"
import * as cognito from "aws-cdk-lib/aws-cognito"
import * as iam from "aws-cdk-lib/aws-iam"

interface PostConfirmationStackProps extends cdk.StackProps {
  vpc: ec2.IVpc,
  securityGroup: ec2.ISecurityGroup,
  userPool: cognito.UserPool
}

export class PostConfirmationStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: PostConfirmationStackProps) {
    super(scope, id, props)

    const postConfirmationFn = new lambdaNodejs.NodejsFunction(this, "postConfirmationAssignGroup", {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: "postConfirmationAssignGroup.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "postConfirmationAssignGroup")),
      vpc: props!.vpc,
      securityGroups: [props!.securityGroup],
      timeout: Duration.seconds(3),
    })

    postConfirmationFn.addToRolePolicy(new iam.PolicyStatement({
      actions: ["cognito-idp:AdminAddUserToGroup"],
      resources: [props!.userPool.userPoolArn]
    }))

    props!.userPool.addTrigger(
      cognito.UserPoolOperation.POST_CONFIRMATION,
      postConfirmationFn,
    )
  }
}
