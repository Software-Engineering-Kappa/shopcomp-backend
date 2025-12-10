import mysql from "mysql2/promise"
import { corsHeaders } from "./cors.mjs"

const userIsAdmin = async (connection, shopperId) => {
  const [results] = await connection.query(
    "SELECT * FROM Shoppers WHERE ID=? AND role='admin'",
    [shopperId],
  )
  return results.length > 0
}

const getTotalShoppers = async (connection) => {
  const [results] = await connection.query(
    "SELECT COUNT(*) as numUsers FROM Shoppers"
  )
  return results[0].numUsers
}

const getTotalChains = async (connection) => {
  const [results] = await connection.query(
    "SELECT COUNT(*) as numChains FROM Chains"
  )
  return results[0].numChains
}

const getTotalStores = async (connection) => {
  const [results] = await connection.query(
    "SELECT COUNT(*) as numStores FROM Stores"
  )
  return results[0].numStores
}

const getTotalMoneySpent = async (connection) => {
  const [results] = await connection.query(
    "SELECT SUM(price * quantity) as totalSales FROM Purchases"
  )
  return results[0].totalSales
}


export const handler = async (event, context) => {
  // Creating header
  const headers = {
    ...corsHeaders(event),
    "Content-Type": "application/json",
  }

  context.callbackWaitsForEmptyEventLoop = false
  const shopperID =
    event?.requestContext?.authorizer?.claims?.sub ||
    event?.requestContext?.authorizer?.jwt?.claims?.sub

  let connection
  try {
    console.log("Opening database connection")
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    })


    // Check if user is an admin
    console.log("Checking admin status")
    const isAdmin = await userIsAdmin(connection, shopperID)
    if (!isAdmin) {
      return {
        statusCode: 403,
        headers: headers,
        body: JSON.stringify({
          error: "Must be an admin",
        })
      }
    }

    // Get admin stats
    console.log("Querying database for admin stats")
    const totalShoppers = await getTotalShoppers(connection)
    const totalChains = await getTotalChains(connection)
    const totalStores = await getTotalStores(connection)
    const totalMoneySpent = await getTotalMoneySpent(connection)
    console.log("Finished all queries")

    // Compile the reuslt into an object
    let results = {
      totalShoppers: totalShoppers,
      totalChains: totalChains,
      totalStores: totalStores,
      totalMoneySpent: totalMoneySpent,
    }

    return {
      statusCode: 200,
      headers: headers,
      body: JSON.stringify(results)
    }
  } catch (error) {
    console.log("Database query error:", error)

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
