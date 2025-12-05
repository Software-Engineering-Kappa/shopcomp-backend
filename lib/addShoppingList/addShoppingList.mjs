import mysql from "mysql2"
import { corsHeaders } from "./cors.mjs"

// Add Shopping List
let addShoppingList = (connection, shopperID, name, type) => {
    return new Promise((resolve, reject) => {
        // Insert a ShoppingList into DB
        const sql = 'INSERT INTO ShoppingLists (name, type, shopperID) VALUES (?, ?, ?);'
        connection.query(sql, [name, type, shopperID], (error, results) =>  {
            if (error) return reject(error.sqlMessage);
            else resolve(results);
        })
    })
}

export const handler = async (event) => {

    // Create Header
    const headers = {
        ...corsHeaders(event),
        "Content-Type": "applications/json"
    }

    // specify credentials
    var connection = mysql.createConnection({
        host: process.env.DB_HOST, // DB endpoint url
        user: process.env.DB_USER, // DB root username
        password: process.env.DB_PASSWORD, // DB password for root user
        database: process.env.DB_NAME // DB identifier
    })


    let code
    let body
    try {
        // Get input from event body
        const requestBody = JSON.parse(event.body)

        // Get ShopperID
        const shopperID =
            event?.requestContext?.authorizer?.claims?.sub ||
            event?.requestContext?.authorizer?.jwt?.claims?.sub

        // Confirm required fields are present
        if (requestBody.name === null || requestBody.type === null) {
            code = 400
            console.log("name", requestBody.name, "type", requestBody.type)
            body = { error: "Missing required fields: name and/or type" }
        } else {

            // Call addShoppingList function
            const addedShoppingList = await addShoppingList(connection, shopperID, requestBody.name, requestBody.type)

            console.log("Shopping List Added:", addedShoppingList);
            code = 200
            body = {
                shoppinglist: {
                    shoppingListID: addedShoppingList.insertId,
                    name: requestBody.name,
                    type: requestBody.type,
                }
            }
        }
    }
    catch (error) {
        console.error("Database query error: ", error)
        code = 500
        body =  { error: "Datebase query error" }
    }

    const response = {
        statusCode: code,
        headers: headers,
        body: JSON.stringify(body)
    }

    return response
}
