import {
  AdminListGroupsForUserCommand,
} from "@aws-sdk/client-cognito-identity-provider"

import mysql from "mysql2/promise"
import { corsHeaders } from "./cors.mjs"

export const handler = async (event) => {
  const headers = {
    ...corsHeaders(event),
    "Content-Type": "application/json",
  }

  // Get shopper id
  const shopperId =
    event?.requestContext?.authorizer?.claims?.sub ||
    event?.requestContext?.authorizer?.jwt?.claims?.sub

  const getGroupsParams = {
    Username: shopperId,
    UserPoolId: process.env.USER_POOL_ID,
  }

  const config = {}
  const client = new CognitoIdentityProviderClient(config)

  try {
    // Make sure the user is an admin
    console.log("Sending get groups request")
    const getGroupsCommand = new AdminListGroupsForUserCommand(getGroupsParams)
    const getGroupResponse = await client.send(getGroupsCommand)
    console.log("Response success")
    const isAdmin = getGroupResponse.Groups?.some(obj => obj.GroupName === "Admin-group")

    if (!isAdmin) {
      return {
        statusCode: 403,
        headers: headers,
        body: JSON.stringify({
          error: "Must be an admin"
        }),
      }
    }
  } catch (error) {
    console.log("Response failure: ", getGroupResponse)

    // Missing parameters in the request (likely USER_POOL_ID) 
    if (error.name === "InvalidParameterException") {
      return {
        statusCode: 403,
        headers: headers,
        body: JSON.stringify({
          error: "Could not verify user group: missing parameters"
        })
      }
    }

    // Too many requests, or rate limit exceeded
    if (error.name === "TooManyRequestsException") {
      return {
        statusCode: 403,
        headers: headers,
        body: JSON.stringify({
          error: "Could not verify user group: too many get group requests"
        })
      }
    }

    // Username not found
    if (error.name === "UserNotFoundException") {
      return {
        statusCode: 403,
        headers: headers,
        body: JSON.stringify({
          error: "Could not verify user group: username does not exist"
        })
      }
    }

    // Other cognito error
    return {
      statusCode: 400,
      headers: headers,
      body: JSON.stringify({
        error: "Could not verify user group: unknown error"
      })
    }
  }

  // Make sure chainId is present
  const chainId = event.pathParameters?.chainId
  if (chainId === undefined) {
    return {
      statusCode: 400,
      headers: headers,
      body: JSON.stringify({
        error: "Missing path parameter"
      }),
    }
  }

  let connection
  try {
    console.log("Opening database connection")
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    })

    // Execute UPDATE statement
    const update = `UPDATE Chains SET isDeleted=TRUE WHERE ID=?`
    const select = `SELECT name FROM Chains WHERE ID=?`
    const [updateResult] = await connection.execute(update, [chainId])
    const [selectResult] = await connection.query(select, [chainId])

    // Check if any rows where changed
    if (updateResult.affectedRows != 1) {
      return {
        statusCode: 400,
        headers: headers,
        body: JSON.stringify({
          error: `Chain with ID=${chainId} does not exist or is already deleted`,
        })
      }
    }

    // Return info about deleted chain
    return {
      statusCode: 200,
      headers: headers,
      body: JSON.stringify({
        id: chainId,
        name: selectResult[0].name,
      })
    }
  } catch (error) {
    console.log(`Database execution error: ${error}`)

    return {
      statusCode: 400,
      headers: headers,
      body: JSON.stringify({
        error: "Database error",
      })
    }
  } finally {
    if (connection) {
      await connection.end()
    }
  }
}
