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

// get other receipt info
const getReceiptInfo = (connection, receiptId) => {
    return new Promise((resolve, reject) => {
        const sqlQuery = `
            SELECT
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
            else resolve(results);
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

export const handler = async (event) => {
    const headers = {
        ...corsHeaders(event),
        "Content-Type": "application/json"
    }

    // construct JSON object
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

        // get purchases
        const purchases = await getPurchases(connection, receiptId);

        // get other receipt info
        const receiptInfo = await getReceiptInfo(connection, receiptId);

        // getReceipt failed to find matching receipt, store, or chain
        if (receiptInfo == undefined || receiptInfo == null || receiptInfo.length < 1) {
            console.log("Receipt (info) not found");
            statusCode = 400;
            body = { "error": "Receipt (info) not found" };
            return { statusCode, headers, body: JSON.stringify(body) };
        }

        // success
        statusCode = 200;
        body = {
            id: receiptId,
            chainName: receiptInfo.chainName,
            date: receiptInfo.date,
            items: purchases.map((p) => ({
                purchaseId: p.purchaseId,
                itemName: p.itemName,
                price: p.price,
                category: p.category,
                quantity: p.quantity
            }))
        };
    } catch (error) {
        console.log("Database error: " + error);
        statusCode = 400;
        body = { "error": "Database query error occurred" };
    } finally {
        // close database connection
        if (connection)
            await connection.end();
    }

    // return response
    const response = {
        statusCode,
        headers,
        body: JSON.stringify(body)
    };

    return response;
}

