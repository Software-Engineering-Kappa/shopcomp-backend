import mysql from "mysql2/promise"
import { corsHeaders } from "./cors.mjs"

const userIsAdmin = async (connection, shopperId) => {
  const sql = `SELECT * FROM Shoppers WHERE ID=? AND role='admin'`
  const [rows] = await connection.query(sql, [shopperId])
  return rows.length > 0
}

export const handler = async (event) => {
  const headers = {
    ...corsHeaders(event),
    "Content-Type": "application/json",
  }

  // Get shopper id
  const shopperId =
    event?.requestContext?.authorizer?.claims?.sub ||
    event?.requestContext?.authorizer?.jwt?.claims?.sub

  console.log("Shopper id: ", shopperId)
  if (shopperId === undefined) {
    return {
      statusCode: 400,
      headers: headers,
      body: JSON.stringify({
        error: "Missing shopper id"
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

    // Make sure shopper is an admin
    const isAdmin = await userIsAdmin(connection, shopperId)
    if (!isAdmin) {
      return {
        statusCode: 403,
        headers: headers,
        body: JSON.stringify({
          error: "Must be an admin"
        }),
      }
    }

    // Execute UPDATE statement
    const update = `UPDATE Chains SET isDeleted=TRUE WHERE ID=?`
    const select = `SELECT name FROM Chains WHERE ID=?`
    const [updateResult] = await connection.execute(update, [chainId])
    const [selectResult] = await connection.query(select, [chainId])
    console.log("Updated rows: ", updateResult.affectedRows)

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
