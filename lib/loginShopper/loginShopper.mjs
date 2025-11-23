import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
} from "@aws-sdk/client-cognito-identity-provider"

export const handler = async (event) => {
  const body = JSON.parse(event.body)
  const username = body.username
  const password = body.password

  // Make sure all body parameters are present
  if (username === undefined || password === undefined) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: "Missing input parameters"
      }),
    }
  }

  const config = {}
  const client = new CognitoIdentityProviderClient(config)

  // Login parameters
  const params = {
    AuthFlow: "USER_PASSWORD_AUTH",
    ClientId: process.env.USER_POOL_CLIENT_ID,
    AuthParameters: {
      USERNAME: username,
      PASSWORD: password,
    }
  }

  try {
    console.log("Sending login request")
    const signUpCommand = new InitiateAuthCommand(params)
    const response = await client.send(signUpCommand)
    console.log("Response success")

    return {
      statusCode: 200,
      body: JSON.stringify({
        accessToken: response.AuthenticationResult.AccessToken,
        idToken: response.AuthenticationResult.IdToken,
        refreshToken: response.AuthenticationResult.RefreshToken,
      })
    }

  } catch (error) {
    console.log("Response error")

    // Cognito cannot use the provided email
    if (error.name === "InvalidEmailRoleAccessPolicyException") {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "Cannot use the provided email"
        })
      }
    }

    // Too many requests, or rate limit exceeded
    if (error.name === "TooManyRequestsException") {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "Too many login requests"
        })
      }
    }

    if (error.name === "UserLambdaValidationException") {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "User validation error"
        })
      }
    }

    // Username not found
    if (error.name === "UserNotFoundException") {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "Username/email does not exist"
        })
      }
    }

    // Other cognito error
    console.error("Unexpected Cognito signup error:", error)
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: "Error logging in"
      })
    }
  }
}

