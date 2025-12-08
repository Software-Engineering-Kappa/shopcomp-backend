import mysql from "mysql2/promise"
import { corsHeaders } from "./cors.mjs"

export const handler = async (event) => {
  const headers = {
    ...corsHeaders(event),
    "Content-Type": "application/json",
  }

  // Make sure path parameters are present
  const receiptId = event.pathParameters.receiptId
  if (receiptId === undefined) {
    return {
      statusCode: 400,
      headers: headers,
      body: JSON.stringify({
        error: "Missing path parameters"
      }),
    }
  }

  // Make sure body parameters are present
  const body = JSON.parse(event.body)
  const itemName = body.itemName
  const price = body.price
  const category = body.category
  const quantity = body.quantity
  const date = body.date

  if (itemName === undefined
    || price === undefined
    || category === undefined
    || quantity === undefined
    || date === undefined
  ) {
    return {
      statusCode: 400,
      headers: headers,
      body: JSON.stringify({
        error: "Missing body parameters"
      }),
    }
  }

  let connection
  let commandNumber     // Stores the most recently run SQL command
  try {
    console.log("Opening database connection")
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    })

    // Query to get the storeID associated with the current receipt
    console.log("Getting store associated with this receipt")
    const getReceiptQuery = "SELECT storeID FROM Receipts WHERE ID=?"
    commandNumber = 1
    const [receipts] = await connection.query(getReceiptQuery, [receiptId])

    if (receipts.length < 1) {
      return {
        statusCode: 400,
        headers: headers,
        body: JSON.stringify({
          error: `Receipt with ID=${receiptId} does not exist`
        }),
      }
    }

    const storeId = receipts[0].storeID

    // Check if the described item already exists in the Items table.
    // Query for an item with a matching name and category.
    console.log("Checking if the described item already exists")
    const getExistingItemsQuery = `
    SELECT DISTINCT Items.ID as itemId
    FROM Items
    JOIN Stores ON Items.storeID = Stores.ID
    WHERE Stores.ID=? AND Items.name=? AND Items.category=?
    `
    commandNumber = 2
    const [existingItems] = await connection.query(
      getExistingItemsQuery, [storeId, itemName, category]
    )
    console.log(`Check successful. Found ${existingItems.length} rows`)

    let itemId
    if (existingItems.length === 0) {
      // If there is no existing item, create a new item
      console.log("Creating an item entry")
      const createItemCommand = `
      INSERT INTO Items (name, category, storeID) VALUES (?, ?, ?)
      `
      commandNumber = 3
      const [createItemResult] = await connection.execute(
        createItemCommand, [itemName, category, storeId]
      )
      console.log("Creating item successful")

      // Set the itemId to the newly inserted item
      itemId = createItemResult.insertId
    } else {
      // If the item exists, use it
      itemId = existingItems[0].itemId
    }

    // Create the purchase entry
    console.log("Creating purchase entry")
    const createPurchaseCommand = `
    INSERT INTO Purchases (price, date, receiptID, itemID, quantity) VALUES (?, ?, ?, ?, ?)
    `
    commandNumber = 4
    await connection.execute(
      createPurchaseCommand, [price, date, receiptId, itemId, quantity]
    )
    console.log("Create purchase successful")


    // Get all the purchases currently on the receipt
    console.log("Getting all the items on the receipt")
    const getAllItemsQuery = `
    SELECT
      Purchases.ID as purchaseId,
      Items.name as itemName,
      Purchases.price as price,
      Items.category as category,
      Purchases.quantity as quantity
    FROM Purchases
    JOIN Items ON Purchases.itemId = Items.ID
    WHERE Purchases.receiptID=?
    `
    commandNumber = 5
    const [allItems] = await connection.query(getAllItemsQuery, [receiptId])
    console.log("Got all items")

    return {
      statusCode: 200,
      headers: headers,
      body: JSON.stringify({
        items: allItems
      })
    }
  } catch (error) {
    console.log(`Database execution error: ${error}`)

    return {
      statusCode: 400,
      headers: headers,
      body: JSON.stringify({
        error: `Database error (on command ${commandNumber})`,
      })
    }
  } finally {
    if (connection) {
      await connection.end()
    }
  }
}

