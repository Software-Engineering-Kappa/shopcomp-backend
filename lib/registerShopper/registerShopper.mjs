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
  if (username === undefined | password === undefined | email === undefined) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: "Missing input parameters"
      }),
    }
  }

  const client = new CognitoIdentityProviderClient({
    region: "us-east-1",
  })

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
    const response = await client.send(new SignUpCommand(params))

    return {
      statusCode: 200,
      body: JSON.stringify({
        username: username,
        email: email,
        password: password,
      })
    }

    // TODO: Should login in user automatically, or should that be frontend?

  } catch (error) {
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
          error: "Not strong enough password"
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
      success: 400,
      body: JSON.stringify({
        error: "Error signing up"
      })
    }
  }
}



