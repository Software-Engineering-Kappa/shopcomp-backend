import mysql from "mysql2";
import { corsHeaders } from "./cors.mjs"

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

const getItems = (shopperID, shoppingListID) => {
    new Promise((resolve, reject) => {
        const sql = `
            SELECT shoppingListID, Items.name, category, quantity, itemID
            FROM ShoppingListItems
            JOIN Items ON ShoppingListItems.itemID = Items.ID
            JOIN ShoppingLists ON ShoppingListItems.shoppingListID = ShoppingLists.ID
            WHERE shoppingListID = ? AND shopperID = ? AND ShoppingListItems.isDeleted = NULL
        `;
        pool.query(sql, [shopperID, shoppingListID], (error, results) => {
            if (error) return reject(error.sqlMessage);
            resolve(results);
        });
    })
}

export const handler = async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false;

    // Creating header
    const headers = {
        ...corsHeaders(event),
        "Content-Type": "application/json"
    }

    let code
    let results = {}
    const shopperID =
        event?.requestContext?.authorizer?.claims?.sub ||
        event?.requestContext?.authorizer?.jwt?.claims?.sub;

    try {
        const shoppingListID = Number(event.pathParameters?.shoppingListId);
        const items = await getItems(shopperID, shoppingListID);
        code = 200 
        
        // success
        results = items
    } catch (error) {
        console.log("Database query error:", error);
        code = 400
    }

    const response = {
        statusCode: code,
        headers: headers,
        body: JSON.stringify(results)
    }
    return response
    
};
