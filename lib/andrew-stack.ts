import * as cdk from "aws-cdk-lib"
import { Construct } from "constructs"
import * as apigw from "aws-cdk-lib/aws-apigateway"

interface AndrewStackProps extends cdk.StackProps {
  apiEndpoint: apigw.RestApi
}

export class AndrewStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: AndrewStackProps) {
    super(scope, id, props)

    // props?.apiEndpoint
  }
}
