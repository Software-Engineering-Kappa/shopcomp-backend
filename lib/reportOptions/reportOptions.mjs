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

    // Get the names of items on this shopping list
    console.log("Getting item names from shopping list")
    console.log("Input listId:", listId)
    const getItemNames = `
    SELECT DISTINCT Items.name
    FROM ShoppingListItems
    JOIN Items ON ShoppingListItems.itemID = Items.ID
    WHERE ShoppingListItems.shoppingListID = ?
    `
    const [itemNamesResult] = await connection.query(getItemNames, [listId])
    console.log("itemNamesResult raw:", JSON.stringify(itemNamesResult))
    const itemNames = itemNamesResult.map(row => row.name)
    console.log("Got item names:", itemNames)

    // If no items on the shopping list, return empty stores array
    if (itemNames.length === 0) {
      console.log("No items found on shopping list, returning empty stores array")
      return {
        statusCode: 200,
        headers: headers,
        body: JSON.stringify({
          stores: []
        })
      }
    }

    // Get a list of all the items on this shopping list that belong to the specified stores
    console.log("Getting items at the selected stores that are on this shopping list")
    
    const getItems = `
    SELECT 
      Items.name as itemName,
      Items.mostRecentPrice as mostRecentPrice,
      Items.storeID as storeId
    FROM Items
    WHERE Items.name IN (?) AND Items.storeID IN (?)
    `
    const [items] = await connection.query(getItems, [itemNames, storeIds])
    console.log("Got items successfully")
    console.log("Items details:", JSON.stringify(items))


    // Get the estimated total cost for all the items at that store 
    console.log("Getting estimated total costs per store")
    const getPredictedTotalCosts = `
    SELECT 
      Items.storeID as storeId,
      Chains.name as chainName,
      SUM(Items.mostRecentPrice) as estimatedPrice
    FROM Items
    JOIN Stores ON Stores.ID = Items.storeID
    JOIN Chains ON Chains.ID = Stores.chainID
    WHERE Items.name IN (?) AND Items.storeID IN (?)
    GROUP BY Items.storeID
    `
    const [predictedTotalCosts] = await connection.query(getPredictedTotalCosts, [itemNames, storeIds])
    console.log("Got estimated costs")
    console.log("predictedTotalCosts details:", JSON.stringify(predictedTotalCosts))

    // Construct output JSON
    console.log("Constructing stores list")
    let stores = []
    for (const storeId of storeIds) {
      // Get the store and items corresponding to this storeId
      const store = predictedTotalCosts.find(item => item.storeId === storeId)
      const storeItems = items.filter(item => item.storeId === storeId)

      if (store === undefined) {
        console.log(`No items for Store ${storeId}`)
        continue
      }

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