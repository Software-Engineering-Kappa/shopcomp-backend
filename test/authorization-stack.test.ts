import {
  CognitoIdentityProviderClient,
  SignUpCommand,
} from "@aws-sdk/client-cognito-identity-provider"

// Load env variables
import * as dotenv from "dotenv"
dotenv.config()

const config = {};
const client = new CognitoIdentityProviderClient(config);
const input = {   // Test input
  ClientId: process.env.USER_POOL_CLIENT_ID!,
  Username: "test-user-0",
  Password: "Test-Pa$$word-123",
  UserAttributes: [
    {
      Name: "email",
      Value: "savagebaba314@gmail.com",
    },
  ],
};

const signUpCommand = new SignUpCommand(input);
// { // SignUpResponse
//   UserConfirmed: true || false, // required
//   CodeDeliveryDetails: { // CodeDeliveryDetailsType
//     Destination: "STRING_VALUE",
//     DeliveryMedium: "SMS" || "EMAIL",
//     AttributeName: "STRING_VALUE",
//   },
//   UserSub: "STRING_VALUE", // required
//   Session: "STRING_VALUE",
// };


test("Shopper can sign up", async () => {
  const response = await client.send(signUpCommand);
  expect(response.UserConfirmed).toBe(false)      // User is not confirmed until they review email
})

