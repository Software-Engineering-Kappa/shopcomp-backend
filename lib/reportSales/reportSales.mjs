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

    // Get sales report grouped by store
    console.log("Getting sales")
    const getSalesQuery = `
    SELECT
        s.ID AS storeID,
        c.name AS chainName,
        c.ID AS chainId,
        s.houseNumber AS houseNumber,
        s.street AS street,
        s.city AS city,
        s.state AS state,
        s.postCode AS postCode,
        s.country AS country,
        COUNT(DISTINCT r.ID) AS numReceipts,
        COUNT(p.ID) AS numPurchases,
        COALESCE(SUM(p.price * p.quantity), 0) AS salesTotalAmount
    FROM Stores s
    LEFT JOIN Receipts r ON r.storeID = s.ID
    LEFT JOIN Purchases p ON p.receiptID = r.ID
    JOIN Chains c ON s.chainID = c.ID
    GROUP BY s.ID, c.name, c.ID
    ORDER BY s.ID;
    `
    const [salesByStore] = await connection.query(getSalesQuery)
    console.log("Got sales successfully")

    // Group salesByStore by chainId.
    const grouped = {}
    for (const row of salesByStore) {
      const chainId = row.chainId
      if (!grouped[chainId]) {
        grouped[chainId] = {
          chainId: chainId,
          chainName: row.chainName,
          salesbyStore: []
        }
      }
      grouped[chainId].salesbyStore.push({
        storeId: row.storeID,
        address: {
          houseNumber: row.houseNumber,
          street: row.street,
          city: row.city,
          state: row.state,
          postCode: row.postCode,
          country: row.country
        },
        numPurchases: row.numPurchases,
        numReceipts: row.numReceipts,
        salesTotalAmount: row.salesTotalAmount
      })
    }

    // Convert the object into an array of the values 
    const groupedByChain = Object.values(grouped)

    // Return sales report
    return {
      statusCode: 200,
      headers: headers,
      body: JSON.stringify(groupedByChain)
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
