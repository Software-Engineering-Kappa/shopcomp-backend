import {
  CognitoIdentityProviderClient,
  SignUpCommand,
} from "@aws-sdk/client-cognito-identity-provider"

export const handler = async (event) => {
  const body = JSON.parse(event.body)
  const username = body.username
  const password = body.password
  const email = body.email

  // Make sure all body parameters are present
  if (username === undefined || password === undefined || email === undefined) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: "Missing input parameters"
      }),
    }
  }

  const config = {}
  const client = new CognitoIdentityProviderClient(config)

  // Registration parameters
  const params = {
    ClientId: process.env.USER_POOL_CLIENT_ID,
    Username: username,
    Password: password,
    UserAttributes: [
      {
        Name: "email",
        Value: email,
      },
    ],
  }

  try {
    console.log("Sending sign up request")
    const signUpCommand = new SignUpCommand(params)
    const response = await client.send(signUpCommand)
    console.log("Response success")

    return {
      statusCode: 200,
      body: JSON.stringify({
        username: username,
        email: email,
        password: password,
      })
    }

  } catch (error) {
    console.log("Response error")

    // User already exists
    if (error.name === "UsernameExistsException") {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "Username already exists"
        })
      }
    }

    // Invalid password policy
    if (error.name === "InvalidPasswordException") {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "Not strong enough password. Must have at least 8 characters, with at least one uppercase letter, one lowercase letter, and one digit."
        })
      }
    }

    // Could not send confirmation email
    if (error.name === "CodeDeliveryFailureException") {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "Failed to send confirmation email"
        })
      }
    }

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
    if (
      error.name === "TooManyRequestsException" ||
      error.name === "LimitExceededException"
    ) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "Too many register requests"
        })
      }
    }

    // Other cognito error
    console.error("Unexpected Cognito signup error:", error)
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: "Error signing up"
      })
    }
  }
}

