import mysql from "mysql2/promise"
import { corsHeaders } from "./cors.mjs"

export const handler = async (event) => {
  const headers = {
    ...corsHeaders(event),
    "Content-Type": "application/json",
  }

  const chainId = event.pathParameters.chainId
  const storeId = event.pathParameters.storeId

  // Make sure path parameters are present
  if (chainId === undefined || storeId === undefined) {
    return {
      statusCode: 400,
      headers: headers,
      body: JSON.stringify({
        error: "Missing path parameters"
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

    // Query store with the given id
    const sql = `SELECT ID, houseNumber, street, city, state, postCode, country FROM Stores WHERE ID=?`
    const [rows] = await connection.query(sql, [storeId])

    // Check if any rows exist
    if (rows.length != 1) {
      return {
        statusCode: 400,
        headers: headers,
        body: JSON.stringify({
          error: `Store with ID=${storeId} does not exist`,
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
        houseNumber: row.houseNumber,
        street: row.street,
        city: row.city,
        state: row.state,
        postCode: row.postCode,
        country: row.country,
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
