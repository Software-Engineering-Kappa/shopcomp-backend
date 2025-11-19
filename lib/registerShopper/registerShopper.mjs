// import {
//   CognitoIdentityProviderClient,
//   SignUpCommand,
// } from "@aws-sdk/client-cognito-identity-provider"

export const handler = async (event) => {
  // const client = new CognitoIdentityProviderClient({
  //   region: "us-east-1",
  // });
  //
  // let statusCode = 200
  //
  // // Registration parameters
  // const params = {
  //   ClientId: process.env.USER_POOL_CLIENT_ID,
  //   Username: "",
  //   Password: "",
  //   UserAttributes: [
  //     {
  //       Name: "email",
  //       Value: "",
  //     },
  //   ],
  // };
  //
  // const command = new SignUpCommand(params)
  // const cognitoResponse = await client.send(command)

  const response = {
    statusCode: statusCode,
    body: JSON.stringify("Hello from registerShopper"),
  }
  return response
}
