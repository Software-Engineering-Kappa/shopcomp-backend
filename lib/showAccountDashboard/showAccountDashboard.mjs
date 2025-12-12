import mysql from "mysql2";
import { corsHeaders } from "./cors.mjs"

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

const getTotalPurchasesAmount = (shopperID) =>
    new Promise((resolve, reject) => {
        pool.query(`
            SELECT COALESCE(SUM(Purchases.price * Purchases.quantity)) AS totalAmount
            FROM Purchases
            JOIN Receipts ON Purchases.receiptID = Receipts.ID
            WHERE Receipts.shopperID=?`,
            [shopperID],
            (error, results) => {
                if (error) return reject(error.sqlMessage);
                resolve(results[0].totalAmount);
            }
        );
    });

export const handler = async (event, context) => {

    // Creating header
    const headers = {
        ...corsHeaders(event),
        "Content-Type": "application/json",
    }

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
        const totalPurchasesAmount = await getTotalPurchasesAmount(shopperID)
        code = 200
        results = {
            totalReceipts: totalReceipts,
            totalShoppingLists: totalShoppingLists,
            totalPurchases: totalPurchases,
            totalPurchasesAmount: totalPurchasesAmount
        }
    } catch (error) {
        console.log("Database query error:", error);
        code = 400
    }

    const response = {
        statusCode: code,
        headers: headers,
        body: JSON.stringify(results)
    }

    return response

};
