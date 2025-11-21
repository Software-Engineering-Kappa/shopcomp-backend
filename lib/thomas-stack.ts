import * as cdk from "aws-cdk-lib"
import { Construct } from "constructs"
import * as apigw from "aws-cdk-lib/aws-apigateway"

interface ThomasStackProps extends cdk.StackProps {
  apiEndpoint: apigw.RestApi
}

export class ThomasStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: ThomasStackProps) {
    super(scope, id, props)

    // props?.apiEndpoint
  }
}
