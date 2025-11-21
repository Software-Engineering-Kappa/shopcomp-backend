import * as cdk from "aws-cdk-lib"
import { Construct } from "constructs"
import * as apigw from "aws-cdk-lib/aws-apigateway"

interface OwenStackProps extends cdk.StackProps {
  apiEndpoint: apigw.RestApi
}

export class OwenStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: OwenStackProps) {
    super(scope, id, props)

    // props?.apiEndpoint
  }
}
