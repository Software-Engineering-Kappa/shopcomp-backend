import mysql from "mysql2";
import { corsHeaders } from "./cors.mjs";

// check that shopperId matches receiptId
const getShopperId = (connection, receiptId) => {
    return new Promise((resolve, reject) => {
        const sqlQuery = `SELECT shopperID FROM Receipts WHERE ID=?`
        connection.query(sqlQuery, [receiptId], (error, results) => {
            if (error) reject(error);
            else resolve(results[0]);
        });
    });
};

// deletes a purchase of the given purchaseId on the receipt of the given receiptId
const deletePurchase = (connection, receiptId, purchaseId) => {
    return new Promise((resolve, reject) => {
        const sqlQuery = `DELETE FROM Purchases WHERE ID=? AND receiptID=? LIMIT 1`
        connection.query(sqlQuery, [purchaseId, receiptId], (error, results) => {
            if (error) reject(error);
            else resolve(results);
        });
    });
};

// returns remaining purchases after deletion of the given receiptId
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
        "Content-Type": "application/json",
    };

    // construct JSON return package
    let statusCode;
    let body;

    let connection;
    try {
        // specify credentials
        connection = mysql.createConnection({
            host: process.env.DB_HOST, // DB endpoint url
            user: process.env.DB_USER, // DB root username
            password: process.env.DB_PASSWORD, // DB password for root user
            database: process.env.DB_NAME // DB identifier
        });

        const givenShopperId =
            event?.requestContext?.authorizer?.claims?.sub ||
            event?.requestContext?.authorizer?.jwt?.claims?.sub;

        const receiptId = event.pathParameters?.receiptId;
        const purchaseId = event.pathParameters?.purchaseId;

        if (!givenShopperId) {
            console.log("Missing or invalid shopperId");
            statusCode = 400;
            body = { "error": "Missing or invalid shopperId" };
            return { statusCode, headers, body: JSON.stringify(body) };
        }

        // ensure present and valid parameters
        if (receiptId == undefined || receiptId == null || receiptId < 0) { // missing or negative receiptId
            console.log("Missing or invalid receiptId");
            statusCode = 400;
            body = { "error": "Missing or invalid receiptId" };
            return { statusCode, headers, body: JSON.stringify(body) };
        } 
        if (purchaseId == undefined || purchaseId == null || purchaseId < 0) { // missing or negative purchaseId
            console.log("Missing or invalid purchaseId");
            statusCode = 400;
            body = { "error": "Missing or invalid purchaseId" };
            return { statusCode, headers, body: JSON.stringify(body) };
        }

        // ensure given shopperId matches receipt's shopperId
        const receiptResponse = await getShopperId(connection, receiptId);
        if (!receiptResponse) {
            console.log("Receipt not found");
            statusCode = 400;
            body = { "error": "Receipt not found" };
            return { statusCode, headers, body: JSON.stringify(body) };
        }
        const receiptShopperId = receiptResponse?.shopperID;
        if (String(receiptShopperId) != String(givenShopperId)) {
            console.log("Permission denied: invalid shopperId");
            statusCode = 400;
            body = { "error": "Permission denied: invalid shopperId" };
            return { statusCode, headers, body: JSON.stringify(body) };
        }

        // delete row
        const deletionResult = await deletePurchase(connection, receiptId, purchaseId);

        // check that at a row was actually deleted
        if (deletionResult.affectedRows < 1) {
            statusCode = 400;
            body = { error: "No purchases deleted, possibly mismatching receiptId and purchaseId" };
            return { statusCode, headers, body: JSON.stringify(body) };
        }  
        // deletion success
        const remainingPurchases = await getPurchases(connection, receiptId);

        // selection success
        statusCode = 200;
        body = {
            items: remainingPurchases.map((p) => ({
                purchaseId: p.purchaseId,
                itemName: p.itemName,
                price: p.price,
                category: p.category,
                quantity: p.quantity
            }))
        };
    } catch (error) { // database query error
        console.log("Database query error occurred: " + error);
        statusCode = 400;
        body = { "error": "Database query error occurred" };
    } finally {
        if (connection) 
            await connection.end();
    }

    // response on success
    const response = {
        statusCode,
        headers,
        body: JSON.stringify(body)
    }

    return response;
}
