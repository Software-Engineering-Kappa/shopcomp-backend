import * as cdk from "aws-cdk-lib"
import { Construct } from "constructs"
import * as apigw from "aws-cdk-lib/aws-apigateway"

interface RyanStackProps extends cdk.StackProps {
  apiEndpoint: apigw.RestApi
}

export class RyanStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: RyanStackProps) {
    super(scope, id, props)

    // props?.apiEndpoint
  }
}
