import mysql from "mysql2";

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

const getTotalReceipts = (shopperID) =>
    new Promise((resolve, reject) => {
        pool.query(
            "SELECT COUNT(*) AS total FROM Receipts WHERE shopperID=?",
            [shopperID],
            (error, results) => {
                if (error) return reject(error.sqlMessage);
                resolve(results[0].total);
            }
        );
    });

const getTotalShoppingLists = (shopperID) =>
    new Promise((resolve, reject) => {
        pool.query(
            "SELECT COUNT(*) AS total FROM ShoppingLists WHERE shopperID=?",
            [shopperID],
            (error, results) => {
                if (error) return reject(error.sqlMessage);
                resolve(results[0].total);
            }
        );
    });

const getTotalPurchases = (shopperID) =>
    new Promise((resolve, reject) => {
        pool.query(
            `SELECT COUNT(*) AS total
       FROM Purchases
       LEFT JOIN Receipts ON Purchases.receiptID = Receipts.ID
       WHERE Receipts.shopperID=?`,
            [shopperID],
            (error, results) => {
                if (error) return reject(error.sqlMessage);
                resolve(results[0].total);
            }
        );
    });

export const handler = async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false;
    let code
    let results = {}
    const shopperID =
        event?.requestContext?.authorizer?.claims?.sub ||
        event?.requestContext?.authorizer?.jwt?.claims?.sub;

    try {
        const totalReceipts = await getTotalReceipts(shopperID) // checkshopperID retrieval method
        const totalShoppingLists = await getTotalShoppingLists(shopperID)
        const totalPurchases = await getTotalPurchases(shopperID)
        code = 200
        results = {
            totalReceipts: totalReceipts,
            totalShoppingLists: totalShoppingLists,
            totalPurchases: totalPurchases
        }
    } catch (error) {
        console.log("Database query error:", error);
        code = 400
    }

    const response = {
        statusCode: code,
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET,OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type,Authorization"
        },
        body: JSON.stringify(results)
    }

    return response

};
