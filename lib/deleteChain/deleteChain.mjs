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

  // Make sure the user is an admin
  const getGroupsParams = {
    Username: shopperId,
    UserPoolId: process.env.USER_POOL_ID,
  }
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

    // 
    const sql = `DELETE FROM Chains WHERE ID=?`
    const [rows] = await connection.query(sql, [chainId])

    // Check if any rows exist
    if (rows.length != 1) {
      return {
        statusCode: 400,
        headers: headers,
        body: JSON.stringify({
          error: `Chain with ID=${chainId} does not exist`,
        })
      }
    }

    // First row
    const row = rows[0]

    // Return store info
    return {
      statusCode: 200,
      headers: headers,
      body: JSON.stringify({
        id: row.ID,
        name: row.name,
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
