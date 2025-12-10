import mysql from "mysql2/promise"
import { corsHeaders } from "./cors.mjs"

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

const getExistingItems = (name, category) => {
  new Promise((resolve, reject) => {
    const sql = `
      SELECT DISTINCT Items.ID as itemID
      FROM Items
      WHERE Items.name=? AND Items.category=?
    `;
    pool.query(sql, [name, categpory], (error, results) => {
      if (error) return reject(error.sqlMessage);
      resolve(results);
    });
  })
}

const createNewItem = (name, category) => {
  new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO Items (name, category) VALUES (?, ?)
    `;
    pool.query(sql, [name, category], (error, results) => {
      if (error) return reject(error.sqlMessage);
      resolve(results);
    });
  })
}

const createNewShoppingListItem = (shoppingListID, itemID, quantity) => {
  new Promise((resolve, reject) => {
    const sql = `INSERT INTO ShoppingListItems (shoppingListID, itemID, quantity) VALUES (?, ?, ?)`;
    pool.query(sql, [shoppingListID, itemID, quantity], (error, results) => {
      if (error) return reject(error.sqlMessage);
      resolve(results);
    });
  })
}

export const handler = async (event) => {

  const headers = {
    ...corsHeaders(event),
    "Content-Type": "application/json",
  }

  // Make sure path parameters are present
  const shoppingListID = Number(event.pathParameters?.id);
  const body = JSON.parse(event.body)
  const name = body.itemName
  const category = body.itemCategory
  const quantity = body.itemQuantity
  const shopperID =
    event?.requestContext?.authorizer?.claims?.sub ||
    event?.requestContext?.authorizer?.jwt?.claims?.sub;

  if (name === undefined || category === undefined || quantity === undefined) {
    code = 400
    results = { error: "Missing body parameters" }
  }

  let code
  let results = {}

  try {

    // Check if the described item already exists in the Items table
    console.log("Checking if the described item already exists")
    const existingItems = await getExistingItems(name, category)

    let itemID
    if (existingItems.length === 0) {
      // Item doesn't exist
      console.log("Creating an item entry")
      const createdItem = await createNewItem(name, category)
      itemID = createdItem.insertId
      console.log("Creating item successful")
    } else {
      // Item exists
      itemID = existingItems[0].itemID
    }

    // Create ShoppingListItem entry
    console.log("Creating ShoppingListItem entry")
    const newShoppingListItem = await createNewShoppingListItem(shoppingListID, itemID, quantity)

    code = 200 // success
    results = {
      shoppingListID: newShoppingListItem.shoppingListID,
      name: existingItems[0].name,
      category: existingItems[0].category,
      quantity: newShoppingListItem.quantity,
      itemID: newShoppingListItem.itemID,
    }

  } catch (error) {
    console.log("Database query error:", error);
    results = { error: "Database query error" }
    code = 400
  }

  const response = {
    statusCode: code,
    headers: headers,
    body: JSON.stringify(results)
  }
  return response
}

