import mysql from "mysql2"
import { corsHeaders } from "./cors.mjs"

const getExistingItems = (name, category, connection) => {
  return new Promise((resolve, reject) => {
    console.log("Executing query for existing items:", { name, category }); // Log inputs
    const sql = `
      SELECT DISTINCT ID as itemID, name, category
      FROM Items
      WHERE Items.name=? AND Items.category=?
    `;
    connection.query(sql, [name, category], (error, results) => {
      if (error) return reject(error.sqlMessage);
      console.log("Existing items query results:", results);
      resolve(results);
    });
  })
}

const createNewItem = (name, category, connection) => {
  return new Promise((resolve, reject) => {
    const insert = `INSERT INTO Items (name, category) VALUES (?, ?)`;
    connection.query(insert, [name, category], (insertError, results) => {
      if (insertError) return reject(insertError.sqlMessage);

      const newItemID = results.insertId;
      console.log("New Item created with ID:", newItemID);

      const select = `SELECT * FROM Items WHERE ID = ?`;
      connection.query(select, [newItemID], (selectError, selectResults) => {
        if (selectError) return reject(selectError.sqlMessage);
        console.log("Newly created item details:", selectResults[0]);
        resolve(selectResults[0]);
      });
    });
  })
}

const getShoppingListItems = (shoppingListID, connection) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT *
      FROM ShoppingListItems
      WHERE ShoppingListItems.shoppingListID=?
    `;
    connection.query(sql, [shoppingListID], (error, results) => {
      if (error) return reject(error.sqlMessage);
      resolve(results);
    });
  })
}

const createNewShoppingListItem = (shoppingListID, itemID, quantity, connection) => {
  return new Promise((resolve, reject) => {
    const sql = `INSERT IGNORE INTO ShoppingListItems (shoppingListID, itemID, quantity) VALUES (?, ?, ?)`;
    connection.query(sql, [shoppingListID, itemID, quantity], (error, results) => {
      if (error) return reject(error.sqlMessage);

      console.log("New ShoppingListItem created");

      const select = `SELECT * FROM ShoppingListItems WHERE shoppingListID=? AND itemID=?`;
      connection.query(select, [shoppingListID, itemID], (selectError, selectResults) => {
        if (selectError) return reject(selectError.sqlMessage);
        console.log("Newly created item details:", selectResults[0]);
        resolve(selectResults[0]);
      });
    });
  })
}

export const handler = async (event) => {

  const headers = {
    ...corsHeaders(event),
    "Content-Type": "application/json",
  }

  // Make sure path parameters are present
  const body = JSON.parse(event.body)
  const shoppingListID = Number(event.pathParameters?.shoppingListID);
  const name = body.name
  const category = body.category
  const quantity = body.quantity

  // Validate body parameters
  if (name === undefined || category === undefined || quantity === undefined) {
    return {
      statusCode: 400,
      headers: headers,
      body: JSON.stringify({
        error: "Missing body parameters"
      }),
    }
  }

  console.log("Opening database connection")
  let connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  })

  let code
  let results = {}

  try {

    // Check if the described item already exists in the Items table
    console.log("Checking if the described item already exists")
    const existingItems = await getExistingItems(name, category, connection)
    console.log("existing items:", existingItems)

    let itemID
    let item = {}
    if (existingItems.length === 0) {
      // Item doesn't exist
      console.log("Creating an item entry")
      const createdItem = await createNewItem(name, category, connection)
      itemID = createdItem.ID
      item = createdItem
      console.log("Creating item successful")
    } else {
      // Item exists
      itemID = existingItems[0].itemID
      item = existingItems[0]
      console.log("Item already exists: ", item)
    }

    // Check if the item is already in the shopping list
    console.log("Checking if the item is already in the shopping list")
    const shoppingListItems = await getShoppingListItems(shoppingListID, connection)
    const itemInList = shoppingListItems.find(sli => sli.itemID === itemID)

    if (itemInList) {
      // Item already in shopping list
      console.log("Item already in shopping list")
      results = { error: "Item already in shopping list" }
      code = 400
      return
    } else {
      // Create ShoppingListItem entry
      console.log("Creating ShoppingListItem entry")
      const newShoppingListItem = await createNewShoppingListItem(shoppingListID, itemID, quantity, connection)
      console.log("Creating ShoppingListItem successful: ", newShoppingListItem)

      code = 200 // success
      results = {
        "item": {
          shoppingListID: shoppingListID,
          name: item.name,
          category: item.category,
          quantity: quantity,
          itemID: itemID,
        }
      }

      console.log("Item successfully added to shopping list:", results)

    }

  } catch (error) {
    console.log("Database query error:", error);
    results = { error: "Database query error" }
    code = 400
  } finally {
    if (connection) {
      console.log("Closing database connection")
      await connection.end()
    }
  }

  const response = {
    statusCode: code,
    headers: headers,
    body: JSON.stringify(results)
  }
  return response
}

