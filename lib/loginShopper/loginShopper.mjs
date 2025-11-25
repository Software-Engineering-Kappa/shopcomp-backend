import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  AdminListGroupsForUserCommand,
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
  const password = body.password

  // Make sure all body parameters are present
  if (username === undefined || password === undefined) {
    return {
      statusCode: 400,
      headers: headers,
      body: JSON.stringify({
        error: "Missing input parameters"
      }),
    }
  }

  const config = {}
  const client = new CognitoIdentityProviderClient(config)

  // Login parameters
  const loginParams = {
    AuthFlow: "USER_PASSWORD_AUTH",
    ClientId: process.env.USER_POOL_CLIENT_ID,
    AuthParameters: {
      USERNAME: username,
      PASSWORD: password,
    }
  }

  let loginResponse
  try {
    console.log("Sending login request")
    const signUpCommand = new InitiateAuthCommand(loginParams)
    loginResponse = await client.send(signUpCommand)
    console.log("Response success")

  } catch (error) {
    console.log("Response error")

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
    if (error.name === "TooManyRequestsException") {
      return {
        statusCode: 400,
        headers: headers,
        body: JSON.stringify({
          error: "Too many login requests"
        })
      }
    }

    if (error.name === "UserLambdaValidationException") {
      return {
        statusCode: 400,
        headers: headers,
        body: JSON.stringify({
          error: "User validation error"
        })
      }
    }

    // Username not found
    if (error.name === "UserNotFoundException") {
      return {
        statusCode: 400,
        headers: headers,
        body: JSON.stringify({
          error: "Username/email does not exist"
        })
      }
    }

    // Missing parameters in the request (likely USER_POOL_CLIENT_ID) 
    if (error.name === "InvalidParameterException") {
      return {
        statusCode: 400,
        headers: headers,
        body: JSON.stringify({
          error: "Missing login parameters"
        })
      }
    }


    // Other cognito error
    console.error("Unexpected Cognito signup error:", error)
    return {
      statusCode: 400,
      headers: headers,
      body: JSON.stringify({
        error: "Error logging in"
      })
    }
  }

  try {
    const getGroupsParams = {
      Username: username,
      UserPoolId: process.env.USER_POOL_CLIENT_ID,
    };

    // Send get group command
    console.log("Sending get groups request")
    const getGroupsCommand = new AdminListGroupsForUserCommand(getGroupsParams)
    const getGroupResponse = await client.send(getGroupsCommand)
    console.log("Response success")

    // Determine if user is in the Admin group
    const isAdmin = getGroupResponse.Groups?.some(obj => obj.GroupName === "Admin-group")
    const role = isAdmin ? "admin" : "shopper"

    return {
      statusCode: 200,
      headers: headers,
      body: JSON.stringify({
        accessToken: loginResponse.AuthenticationResult.AccessToken,
        idToken: loginResponse.AuthenticationResult.IdToken,
        refreshToken: loginResponse.AuthenticationResult.RefreshToken,
        role: role,
      })
    }
  } catch (error) {
    // Do not return a role
    return {
      statusCode: 200,
      headers: headers,
      body: JSON.stringify({
        accessToken: loginResponse.AuthenticationResult.AccessToken,
        idToken: loginResponse.AuthenticationResult.IdToken,
        refreshToken: loginResponse.AuthenticationResult.RefreshToken,
      })
    }
  }
}

