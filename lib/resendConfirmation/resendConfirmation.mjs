import {
  CognitoIdentityProviderClient,
  ResendConfirmationCodeCommand
} from "@aws-sdk/client-cognito-identity-provider"

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,Authorization"
}

export const handler = async (event) => {
  const body = JSON.parse(event.body)
  const username = body.username

  // Make sure all body parameters are present
  if (username === undefined) {
    return {
      statusCode: 400,
      headers: headers,
      body: JSON.stringify({
        error: "Missing input parameters"
      })
    }
  }

  const config = {}
  const client = new CognitoIdentityProviderClient(config)
  const input = {
    ClientId: process.env.USER_POOL_CLIENT_ID,
    Username: username,
  }

  try {
    console.log("Sending resend request")
    const command = new ResendConfirmationCodeCommand(input);
    const resendResponse = await client.send(command);
    console.log("Response success")

    return {
      statusCode: 200,
      headers: headers,
      body: JSON.stringify({
        username: username,
      })
    }
  } catch (error) {
    // Exception documentation: https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/cognito-identity-provider/command/ResendConfirmationCodeCommand/
    console.log("Response error")

    // Bad username provided
    if (error.name === "UserNotFoundException") {
      return {
        statusCode: 400,
        headers: headers,
        body: JSON.stringify({
          error: "Username not found"
        })
      }
    }

    // Could not send confirmation email
    if (error.name === "CodeDeliveryFailureException") {
      return {
        statusCode: 400,
        headers: headers,
        body: JSON.stringify({
          error: "Failed to send confirmation email"
        })
      }
    }

    // Cognito cannot use the provided email
    if (error.name === "InvalidEmailRoleAccessPolicyException") {
      return {
        statusCode: 400,
        headers: headers,
        body: JSON.stringify({
          error: "Cannot use the provided email"
        })
      }
    }

    // Too many requests, or rate limit exceeded
    if (
      error.name === "TooManyRequestsException" ||
      error.name === "LimitExceededException"
    ) {
      return {
        statusCode: 400,
        headers: headers,
        body: JSON.stringify({
          error: "Too many confirmation requests"
        })
      }
    }

    // Too many failed attempts
    if (error.name === "TooManyFailedAttemptsException") {
      return {
        statusCode: 400,
        headers: headers,
        body: JSON.stringify({
          error: "Too many failed attempts"
        })
      }
    }

    // Other cognito error
    console.error("Unexpected Cognito signup error:", error)
    return {
      statusCode: 400,
      headers: headers,
      body: JSON.stringify({
        error: "Error resending code"
      })
    }
  }
}

