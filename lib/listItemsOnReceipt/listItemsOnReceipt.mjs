import mysql from "mysql2";
import { corsHeaders } from "./cors.mjs";

// Get purchases on given receiptId
const getPurchases = (connection, receiptId) => {
    return new Promise((resolve, reject) => {
        const sqlQuery = `
            SELECT 
                Purchases.ID as purchaseId,
                Items.name as itemName,
                Purchases.price as price,
                Items.category as category,
                Purchases.quantity as quantity
            FROM
                Purchases
                INNER JOIN Items
                ON Purchases.itemID = Items.ID
            WHERE
                Purchases.receiptID=?
        `;
        connection.query(sqlQuery, [receiptId], (error, results) => {
            if (error) reject(error);
            else resolve(results);
        });
    });
};

export const handler = async (event) => {
    const headers = {
        ...corsHeaders(event),
        "Conent-Type": "application/json"
    }

    // specify credentials
    const connection = mysql.createConnection({
        host: process.env.DB_HOST, // DB endpoint url
        user: process.env.DB_USER, // DB root username
        password: process.env.DB_PASSWORD, // DB password for root user
        database: process.env.DB_NAME // DB identifier
    });

    // construct JSON object
    let statusCode;
    let body;
    try {
        const receiptId = event.pathParameters?.receiptId;
        
        // check present and valid receiptId
        if (!receiptId || receiptId < 0) {
            statusCode = 400;
            body = {
                error: "Invalid or missing receiptId"
            };
        } else {
            const purchases = await getPurchases(connection, receiptId);

            statusCode = 200;
            body = {
                items: purchases.map((p) => ({
                    purchaseId: p.purchaseId,
                    itemName: p.itemName,
                    price: p.price,
                    category: p.category,
                    quantity: p.quantity
                }))
            };
        } 
    } catch (error) {
        console.log("Database error: " + error);
        statusCode = 400;
        body = {
            error: "Database query error occurred"
        };
    } finally {
        // close database connection
        connection.end();
    }

    // return response
    const response = {
        statusCode,
        headers,
        body: JSON.stringify(body)
    };

    return response;
}

