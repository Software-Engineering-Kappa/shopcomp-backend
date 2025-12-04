import mysql from "mysql2";
import { corsHeaders } from "./cors.mjs";

// Get receipts, given shopperId
let getReceipts = (connection, shopperID) => {
    return new Promise((resolve, reject) => {
        const sqlQuery = `
            SELECT
                Receipts.ID,
                Chains.name as chainName,
                Receipts.date
            FROM
                Receipts
                JOIN Stores ON Receipts.storeID = Stores.ID
                JOIN Chains ON Stores.chainID = Chains.ID
            WHERE
                Receipts.shopperID=?;
        `;
        connection.query(sqlQuery, [shopperID], (error, results) => {
            if (error) reject(error);
            else resolve(results);
        });
    });
}

// Get total amount of receipt, given receiptId
let getTotalAmount = (connection, receiptId) => {
    return new Promise((resolve, reject) => {
        const sqlQuery = `
            SELECT
                Purchases.price
            FROM
                Purchases
            WHERE 
                Purchases.receiptID=?;
        `;
        connection.query(sqlQuery, [receiptId], (error, results) => {
            if (error) reject(error);
            else {
                let sum = 0;
                results.forEach((r) => sum += Number(r.price));
                resolve(sum);
            }
        });
    });
}

export const handler = async (event) => {
    const headers = {
        ...corsHeaders(event),
        "Content-Type": "application/json"
    };

    // specify credentials
    var connection = mysql.createConnection({
        host: process.env.DB_HOST, // DB endpoint url
        user: process.env.DB_USER, // DB root username
        password: process.env.DB_PASSWORD, // DB password for root user
        database: process.env.DB_NAME // DB identifier
    });

    // return JSON object
    let statusCode;
    let body;

    try {
        const shopperID =
            event?.requestContext?.authorizer?.claims?.sub ||
            event?.requestContext?.authorizer?.jwt?.claims?.sub;

        const receipts = await getReceipts(connection, shopperID);
        
        // success
        const receiptList = await Promise.all(
            receipts.map(async (r) => ({
                receiptId: r.ID,
                storeName: r.chainName,
                date: r.date.toString().slice(0, 19).replace("T", " "), // removed .toISOString()
                totalAmount: await getTotalAmount(connection, r.ID)
            }))
        );
        body = {
            receiptList: receiptList
        };

    } catch (error) {
        console.error("Database query error: ", error)
        return {
            statusCode: 400,
            headers: headers,
            body: JSON.stringify({
                error: "Database error",
            })
        }
    } finally {
        connection.end();
    }
    
    const response = {
        statusCode: statusCode,
        headers: headers,
        body: JSON.stringify(body)
    };

    return response;
}