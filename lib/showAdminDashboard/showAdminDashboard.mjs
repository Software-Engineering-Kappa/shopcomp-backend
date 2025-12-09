import mysql from "mysql2"
import { corsHeaders } from "./cors.mjs"

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
})

const userIsAdmin = async (shopperId) =>
  new Promise((resolve, reject) => {
    pool.query(
      "SELECT * FROM Shoppers WHERE ID=? AND role='admin'",
      [shopperId],
      (error, results) => {
        if (error) return reject(error.message)
        resolve(results.length > 0)
      }
    )
  })

const getTotalShoppers = () =>
  new Promise((resolve, reject) => {
    pool.query(
      "SELECT COUNT(*) as numUsers FROM Shoppers", [],
      (error, results) => {
        if (error) return reject(error.message)
        resolve(results[0].numUsers)
      }
    )
  })

const getTotalChains = () =>
  new Promise((resolve, reject) => {
    pool.query(
      "SELECT COUNT(*) as numChains FROM Chains", [],
      (error, results) => {
        if (error) return reject(error.message)
        resolve(results[0].numChains)
      }
    )
  })

const getTotalStores = () =>
  new Promise((resolve, reject) => {
    pool.query(
      "SELECT COUNT(*) as numStores FROM Stores", [],
      (error, results) => {
        if (error) return reject(error.message)
        resolve(results[0].numStores)
      }
    )
  })

const getTotalMoneySpent = () =>
  new Promise((resolve, reject) => {
    pool.query(
      "SELECT SUM(price * quantity) as totalSales FROM Purchases", [],
      (error, results) => {
        if (error) return reject(error.message)
        resolve(results[0].totalSales)
      }
    )
  })


export const handler = async (event, context) => {
  // Creating header
  const headers = {
    ...corsHeaders(event),
    "Content-Type": "application/json",
  }

  context.callbackWaitsForEmptyEventLoop = false
  let code
  let results = {}
  let body
  const shopperID =
    event?.requestContext?.authorizer?.claims?.sub ||
    event?.requestContext?.authorizer?.jwt?.claims?.sub

  // Check if user is an admin
  const isAdmin = userIsAdmin(shopperID)
  if (!isAdmin) {
    return {
      statusCode: 403,
      headers: headers,
      body: JSON.stringify({
        error: "Must be an admin",
      })
    }
  }

  try {
    // Get admin stats
    const totalShoppers = getTotalShoppers()
    const totalChains = getTotalChains()
    const totalStores = getTotalChains()
    const totalMoneySpent = getTotalMoneySpent()

    // Compile the reuslt into an object
    code = 200
    results = {
      totalShoppers,
      totalChains,
      totalStores,
      totalMoneySpent,
    }

    body = JSON.stringify(results)
  } catch (error) {
    console.log("Database query error:", error)
    code = 400
    body = JSON.stringify({ error: "Database error" })
  }

  const response = {
    statusCode: code,
    headers: headers,
    body: body,
  }

  return response
}
