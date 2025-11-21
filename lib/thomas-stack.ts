import * as cdk from "aws-cdk-lib"
import { Construct } from "constructs"
import * as apigw from "aws-cdk-lib/aws-apigateway"
import * as ec2 from "aws-cdk-lib/aws-ec2"

interface ThomasStackProps extends cdk.StackProps {
  apiEndpoint: apigw.RestApi,
  vpc: ec2.IVpc,
  securityGroup: ec2.ISecurityGroup,
}

export class ThomasStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: ThomasStackProps) {
    super(scope, id, props)

    // props?.apiEndpoint
  }
}
