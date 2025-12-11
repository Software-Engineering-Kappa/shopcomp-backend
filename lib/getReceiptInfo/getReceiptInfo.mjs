import mysql from "mysql2";
import { corsHeaders } from "./cors.mjs";

// get receipt info
const getReceiptInfo = (connection, receiptId) => {
    return new Promise((resolve, reject) => {
        const sqlQuery = `
            SELECT
                Receipts.ID as receiptId,
                Stores.chainID as chainId,
                Receipts.storeID as storeId,
                Chains.name as chainName,
                Receipts.date as date
            FROM
                Receipts
                INNER JOIN Stores
                ON Receipts.storeID = Stores.ID
                INNER JOIN Chains
                ON Stores.chainID = Chains.ID
            WHERE
                Receipts.ID=?
        `;
        connection.query(sqlQuery, [receiptId], (error, results) => {
            if (error) reject(error);
            else resolve(results[0]);
        });
    });
};

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

// check that shopperId matches receiptId
const getShopperId = (connection, receiptId) => {
    return new Promise((resolve, reject) => {
        const sqlQuery = `SELECT shopperID FROM Receipts WHERE ID=?`
        connection.query(sqlQuery, [receiptId], (error, results) => {
            if (error) reject(error);
            else resolve(results);
        });
    });
};

const handler = async (event) => {

    const headers = {
      ...corsHeaders(event),
      "Content-Type": "application/json",
    }

    let statusCode;
    let body;

    let connection;
    try {

        const receiptId = Number(event.pathParameters?.receiptId);

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

        if (!givenShopperId) {
            console.log("Missing or invalid shopperId");
            statusCode = 400;
            body = { "error": "Missing or invalid shopperId" };
            return { statusCode, headers, body: JSON.stringify(body) };
        }   

        // check present and valid receiptId
        if (!receiptId || isNaN(receiptId) || receiptId < 0) {
            console.log("Invalid or missing receiptId");
            statusCode = 400;
            body = { "error": "Invalid or missing receiptId" };
            return { statusCode, headers, body: JSON.stringify(body) };
        }

        // ensure given shopperId matches receipt's shopperId
        const receiptResponse = await getShopperId(connection, receiptId);
        if (!receiptResponse) {
            console.log("Receipt not found, #1");
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

        // get receipt info
        const receiptInfoRows = await getReceiptInfo(connection, receiptId);

        // check that receiptInfoRows returned a row
        if (receiptInfoRows.length < 1) {
            console.log("Receipt not found, #2");
            statusCode = 400;
            body = { "error": "Receipt not found" };
            return { statusCode, headers, body: JSON.stringify(body) };
        }

        // get purchases
        const purchases = await getPurchases(connection, receiptId);

        // success
        const receiptInfo = receiptInfoRows[0];
        statusCode = 200;
        body = {
            receiptId: receiptInfo.receiptId,
            chainId: receiptInfo.chainId,
            storeId: receiptInfo.storeId,
            chainName: receiptInfo.chainName,
            date: receiptInfo.date.toString().slice(0, 19).replace("T", " "), // removed .toISOString()
            items: purchases.map((p) => ({
                purchaseId: p.purchaseId,
                itemName: p.itemName,
                price: p.price,
                category: p.category,
                quantity: p.quantity
            }))
        }
    } catch (error) {
        console.log("Database error: " + error);
        statusCode = 400;
        body = { "error": "Database query error occurred" };
    } finally {
        if (connection)
            connection.end();
    }
            
    const response = {
        statusCode,
        headers,
        body: JSON.stringify(body)
    }

    return response;
}
