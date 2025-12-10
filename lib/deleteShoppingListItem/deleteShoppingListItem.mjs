import mysql from "mysql2";
import { corsHeaders } from "./cors.mjs";

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

// deletes a purchase of the given purchaseId on the receipt of the given receiptId
const deleteShoppingListItem = (shopperID, shoppingListID, itemID) => {
    return new Promise((resolve, reject) => {
        const sql = `
            UPDATE ShoppingListItems 
            SET isDeleted=1
            FROM ShoppingListItems
            JOIN ShoppingLists ON ShoppingListItems.shoppingListID=ShoppingLists.ID
            WHERE shoppingListID=? AND itemID=? AND shopperID=? AND isDeleted=0
        `;
        pool.query(sql, [shoppingListID, itemID, shopperID], (error, results) => {
            if (error) return reject(error.sqlMessage);
            resolve(results);
        });
    });
};


export const handler = async (event) => {
    const headers = {
        ...corsHeaders(event),
        "Content-Type": "application/json",
    };

    let code
    let result = {}
    const shoppingListID = Number(event.pathParameters?.id);
    const itemID = Number(event.pathParameters?.itemID);
    const shopperID =
        event?.requestContext?.authorizer?.claims?.sub ||
        event?.requestContext?.authorizer?.jwt?.claims?.sub;


    // Validate body parameters
    if (shoppingListID === undefined || shopperID === undefined || itemID === undefined) {
        return {
            statusCode: 400,
            headers: headers,
            body: JSON.stringify({
                error: "Missing body parameters"
            }),
        }
    }

    try {

        const deleteResponse = await deleteShoppingListItem(shopperID, shoppingListID, itemID);
        // check that at a row was actually deleted
        if (deleteResponse.affectedRows < 1) {
            code = 400;
            result = { error: "No shopping list items deleted, possibly mismatching receiptId and purchaseId" };
            return { 
                statusCode: code,
                headers: headers,
                body: JSON.stringify(result) 
            };
        }

        // selection success
        statusCode = 200;
        result = { deleteResponse };
    } catch (error) { // database query error
        console.log("Database query error occurred: " + error);
        code = 400;
        result = { "error": "Database query error occurred" };
    }

    // response on success
    const response = {
        statusCode: code,
        headers: headers,
        body: JSON.stringify(result)
    }

    return response;
}
