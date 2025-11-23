import mysql from "mysql2";

// Get receipts, given shopperId
let getReceipts = (connection, shopperId) => {
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
        connection.query(sqlQuery, [shopperId], (error, results) => {
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
                results.foreach((r) => sum += r.price);
                resolve(sum);
            }
        });
    });
}

export const handler = async (event) => {

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
        const shopperId =
            event?.requestContext?.authorizer?.claims?.sub ||
            event?.requestContext?.authorizer?.jwt?.claims?.sub;

        const receipts = await getReceipts(connection, shopperId);

        // success
        statusCode = 200;
        body = { // TODO change body stucture
            receiptList: receipts.map((r) => ({
                receiptId: r.ID,
                storeName: r.chainName,
                date: r.date,
                totalAmount: getTotalAmount(connection, r.ID)
            }))
        };
    } catch (error) {
        // failure
        statusCode = 400;
        console.error("Database query error: ", error);
    } finally {
        connection.end();
    }
    
    const response = {
        statusCode: statusCode,
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET,OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type,Authorization"
        },
        body: JSON.stringify(body)
    };

    return response;
}