import mysql from "mysql2";
import { corsHeaders } from "./cors.mjs"

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

// Get shopping lists, given shopperId
let getShoppingLists = (shopperID) => {
    new Promise((resolve, reject) => {
        const sql = `
            SELECT *
            FROM ShoppingLists
            WHERE ShoppingLists.shopperID = ?
              AND ${dateCondition}`;
        pool.query(sql, [shopperID], (error, results) => {
            if (error) return reject(error.sqlMessage);
            resolve(results[0].total);
        });
    })
}

export const handler = async (event) => {

    // Creating header
    const headers = {
        ...corsHeaders(event),
        "Content-Type": "application/json",
    }

    let code
    let results = {}

    // Get Shopper ID
    const shopperID =
        event?.requestContext?.authorizer?.claims?.sub ||
        event?.requestContext?.authorizer?.jwt?.claims?.sub;

    try {
        const shoppingLists = await getShoppingLists(shopperID);
        code = 200

        // success
        const listOfShoppingLists = await Promise.all(
            shoppingLists.map(async (shoppingList) => ({
                ID: shoppingList.ID,
                name: shoppingList.name,
                type: shoppingList.type,
            }))
        );
        results = listOfShoppingLists;
    }
    catch (error) {
        console.log("Database query error:", error);
        code = 500
    }

    const response = {
        statusCode: code,
        headers: headers,
        body: JSON.stringify(results)
    }

    return response
}