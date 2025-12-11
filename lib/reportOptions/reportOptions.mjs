import mysql from "mysql2/promise"
import { corsHeaders } from "./cors.mjs"

export const handler = async (event) => {
  const headers = {
    ...corsHeaders(event),
    "Content-Type": "application/json",
  }

  // Get path parameters
  const listId = event.pathParameters?.shoppingListID
  if (listId === undefined) {
    return {
      statusCode: 400,
      headers: headers,
      body: JSON.stringify({
        error: "Missing path parameters"
      }),
    }
  }

  // Get body parameters
  const body = JSON.parse(event.body)
  const storeIds = body.storeIds

  if (storeIds === undefined || storeIds.length === undefined) {
    return {
      statusCode: 400,
      headers: headers,
      body: JSON.stringify({
        error: "Missing storeIds (or none provided)"
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

    // Get a list of all the items on this shopping list that belong to the specified stores
    console.log("Getting items at the selected stores that are on this shopping list")
    const getItems = `
    SELECT 
      Items.name as itemName,
      Items.mostRecentPrice as mostRecentPrice,
      Items.storeID as storeId
    FROM Items
    JOIN ShoppingListItems ON ShoppingListItems.itemID = Items.ID
    WHERE Items.storeID IN (?) AND ShoppingListItems.shoppingListID=?
    `
    const [items] = await connection.execute(getItems, [storeIds, listId])
    console.log("Got items successfully")


    // Get the estimated total cost for all the items at that store 
    console.log("Getting estimated total costs per store")
    const getPredictedTotalCosts = `
    SELECT 
      Items.storeId as storeId,
      Chains.name as chainName,
      SUM(Items.mostRecentPrice) as estimatedPrice
    FROM Items
    JOIN ShoppingListItems ON ShoppingListItems.itemID = Items.ID
    JOIN Stores ON Stores.ID = Items.storeID
    JOIN Chains ON Chains.ID = Stores.chainID
    WHERE Items.storeID IN (?) AND ShoppingListItems.shoppingListID=?
    GROUP BY Items.storeID
    `
    const [predictedTotalCosts] = await connection.execute(getPredictedTotalCosts, [storeIds, listId])
    console.log("Got estimated costs")

    // Construct output JSON
    console.log("Constructing stores list")
    let stores = []
    for (const storeId of storeIds) {
      // Get the store and items corresponding to this storeId
      const store = predictedTotalCosts.find(item => item.storeId === storeId)
      const storeItems = items.filter(item => item.storeId === storeId)

      // Get the name and price of each item from this store
      const priceBreakdown = storeItems.map((item) => {
        return {
          itemName: item.itemName,
          mostRecentPrice: item.mostRecentPrice,
        }
      })

      stores.push({
        storeId: storeId,
        chainName: store.chainName,
        estimatedPrice: store.estimatedPrice,
        priceBreakdown: priceBreakdown,
      })
    }

    // Return sales report
    return {
      statusCode: 200,
      headers: headers,
      body: JSON.stringify({
        stores: stores
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
