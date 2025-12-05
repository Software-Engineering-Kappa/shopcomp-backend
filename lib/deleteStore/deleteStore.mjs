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

  // Make sure storeId is present
  const storeId = event.pathParameters?.storeId
  if (storeId === undefined) {
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
    const update = `UPDATE Stores SET isDeleted=TRUE WHERE Stores.ID=?`
    const select = `
    SELECT
      Stores.ID, Stores.chainID, Chains.name as chainName,
      Stores.houseNumber, Stores.street, Stores.city, Stores.postCode, Stores.country
    FROM Stores JOIN Chains ON Stores.chainID = Chains.ID 
    WHERE Stores.ID=?
    `
    const [updateResult] = await connection.execute(update, [storeId])
    const [selectResult] = await connection.query(select, [storeId])
    console.log("Updated rows: ", updateResult.affectedRows)

    // Check if any rows where changed
    if (updateResult.affectedRows != 1) {
      return {
        statusCode: 400,
        headers: headers,
        body: JSON.stringify({
          error: `Store with ID=${storeId} does not exist`,
        })
      }
    }

    // Return info about deleted store
    return {
      statusCode: 200,
      headers: headers,
      body: JSON.stringify({
        id: storeId,
        chainId: selectResult[0].chainId,
        chainName: selectResult[0].chainName,
        address: {
          houseNumber: selectResult[0].houseNumber,
          street: selectResult[0].street,
          city: selectResult[0].city,
          postCode: selectResult[0].postCode,
          country: selectResult[0].country,
        }
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

