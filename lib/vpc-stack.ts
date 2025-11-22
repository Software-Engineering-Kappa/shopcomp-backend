import * as cdk from "aws-cdk-lib"
import { Construct } from "constructs"
import * as ec2 from "aws-cdk-lib/aws-ec2"

export class VpcStack extends cdk.Stack {
  public readonly vpc: ec2.IVpc
  public readonly securityGroup: ec2.ISecurityGroup

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    // Import VPC
    this.vpc = ec2.Vpc.fromVpcAttributes(this, "VPC", {
      vpcId: "vpc-00af27809d4ee6d0e",

      availabilityZones: [
        "us-east-1a",
        "us-east-1b",
        "us-east-1c"
      ],

      privateSubnetIds: [
        "subnet-01c9945aed1421e38",
        "subnet-06b6d3060c96ee6f4",
        "subnet-00da31b049de1eacb",
      ],
    })

    // Import security group
    this.securityGroup = ec2.SecurityGroup.fromSecurityGroupId(this, "SG",
      "sg-0df434762caae7a53",
      { mutable: false }
    )
  }
}
