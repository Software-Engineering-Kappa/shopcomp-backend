import mysql from "mysql2/promise"
import { corsHeaders } from "./cors.mjs"

export const handler = async (event) => {
  const headers = {
    ...corsHeaders(event),
    "Content-Type": "application/json",
  }

  // Make sure chainId is present
  const chainId = event.pathParameters?.chainId
  if (chainId === undefined) {
    return {
      statusCode: 400,
      headers: headers,
      body: JSON.stringify({
        error: "Missing path parameters"
      }),
    }
  }

  // return JSON object
  let connection
  try {
    console.log("Opening database connection")
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    })

    // Create entry in database for this user
    const sql = `SELECT ID, name, url FROM Chains WHERE ID=?`
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

    let url = "N/A"
    if (row.url != null) url = row.url

    // Return store info
    return {
      statusCode: 200,
      headers: headers,
      body: JSON.stringify({
        id: row.ID,
        name: row.name,
        url: url
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
