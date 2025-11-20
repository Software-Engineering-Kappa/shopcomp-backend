import {
  CognitoIdentityProviderClient,
  ConfirmSignUpCommand
} from "@aws-sdk/client-cognito-identity-provider"

export const handler = async (event) => {
  const body = JSON.parse(event.body)
  const username = body.username
  const confirmationCode = body.confirmationCode

  // Make sure all body parameters are present
  if (username === undefined || confirmationCode === undefined) {
    return {
      statusCode: 400,
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
    ConfirmationCode: confirmationCode,
  };

  try {
    console.log("Sending confirm request")
    const command = new ConfirmSignUpCommand(input);
    const signUpResponse = await client.send(command);
    console.log("Response success")

    return {
      statusCode: 200,
      body: JSON.stringify({
        username: username,
        session: signUpResponse.Session,
      })
    }
  } catch (error) {
    // Exception documentation: https://docs.aws.amazon.com/cognito-user-identity-pools/latest/APIReference/API_ConfirmSignUp.html
    console.log("Response error")

    // Incorrect code provided
    if (error.name === "CodeMismatchException") {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "Confirmation code incorrect"
        })
      }
    }

    // Bad username provided
    if (error.name === "UserNotFoundException") {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "Username not found"
        })
      }
    }

    // Confirmation code expired
    if (error.name === "ExpiredCodeException") {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "Confirmation code expired"
        })
      }
    }

    if (error.name === "AliasExistsException") {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "An account with the same email already exists"
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
        body: JSON.stringify({
          error: "Too many confirmation requests"
        })
      }
    }

    // Too many failed attempts
    if (error.name === "TooManyFailedAttemptsException") {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "Too many failed attempts"
        })
      }
    }

    // Other cognito error
    console.error("Unexpected Cognito signup error:", error)
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: "Error confirming"
      })
    }
  }
}

