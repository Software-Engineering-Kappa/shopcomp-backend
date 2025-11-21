import * as cdk from "aws-cdk-lib"
import { Construct } from "constructs"
import * as apigw from "aws-cdk-lib/aws-apigateway"
import * as ec2 from "aws-cdk-lib/aws-ec2"

interface AndrewStackProps extends cdk.StackProps {
  apiEndpoint: apigw.RestApi,
  vpc: ec2.IVpc,
  securityGroup: ec2.ISecurityGroup,
}

export class AndrewStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: AndrewStackProps) {
    super(scope, id, props)

    // props?.apiEndpoint
  }
}
