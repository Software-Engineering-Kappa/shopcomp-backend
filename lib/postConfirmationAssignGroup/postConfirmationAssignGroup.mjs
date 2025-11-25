import {
  CognitoIdentityProviderClient,
  AdminAddUserToGroupCommand
} from "@aws-sdk/client-cognito-identity-provider"

export const handler = async (event) => {
  const username = event.userName
  const userPoolId = event.userPoolId

  const config = {}
  const client = new CognitoIdentityProviderClient(config)

  // Default ALL new users to "Shopper-group"
  const command = new AdminAddUserToGroupCommand({
    UserPoolId: userPoolId,
    Username: username,
    GroupName: "Shopper-group",
  })

  await client.send(command)

  return event
}

