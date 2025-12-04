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

    // Query store items with the given id
    const sql = `
    SELECT DISTINCT 
        Items.ID as id,
        Items.name as name,
        Items.category as category,
        Items.mostRecentPrice as mostRecentPrice
    FROM Purchases
    JOIN Receipts ON Purchases.receiptID = Receipts.ID
    JOIN Items ON Purchases.itemID = Items.ID
    JOIN Stores ON Receipts.storeID = Stores.Id
    WHERE Stores.ID = ?;
    `
    const [rows] = await connection.query(sql, [storeId])

    // Return store items
    return {
      statusCode: 200,
      headers: headers,
      body: JSON.stringify({
        items: rows
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

