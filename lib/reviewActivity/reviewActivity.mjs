import mysql from "mysql2";
import { corsHeaders } from "./cors.mjs"

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

const getDateCondition = (timeUnits, tableName) => {
    switch (timeUnits) {
        case 'day':
            return `DATE(${tableName}.date) = CURRENT_DATE()`;
        case 'week':
            return `YEARWEEK(${tableName}.date, 1) = YEARWEEK(CURRENT_DATE(), 1)`;
        case 'month':
            return `
                YEAR(${tableName}.date) = YEAR(CURRENT_DATE())
                AND MONTH(${tableName}.date) = MONTH(CURRENT_DATE())`;
        case 'year':
            return `YEAR(${tableName}.date) = YEAR(CURRENT_DATE())`;
        default:
            throw new Error("Invalid timeUnits value");
    }
}

const getNumReceipts = (shopperID, timeUnits) =>
    new Promise((resolve, reject) => {
        const dateCondition = getDateCondition(timeUnits, 'Receipts');
        const sql = `
            SELECT COUNT(*) AS total
            FROM Receipts
            WHERE shopperID = ?
                AND ${dateCondition}`;

        pool.query(sql, [shopperID], (error, results) => {
            if (error) return reject(error.sqlMessage);
            resolve(results[0].total);
        });
    }
    );

const getNumPurchases = (shopperID, timeUnits) =>
    new Promise((resolve, reject) => {
        const dateCondition = getDateCondition(timeUnits, 'Purchases');
        const sql = `
            SELECT COUNT(*) AS total
            FROM Purchases
            JOIN Receipts ON Receipts.ID = Purchases.receiptID
            WHERE Receipts.shopperID = ?
              AND ${dateCondition}`;

        pool.query(sql, [shopperID], (error, results) => {
            if (error) return reject(error.sqlMessage);
            resolve(results[0].total);
        });
    }
    );

const getTotalPurchaseAmount = (shopperID, timeUnits) =>
    new Promise((resolve, reject) => {
        const dateCondition = getDateCondition(timeUnits, 'Receipts');
        const sql = `
            SELECT COALESCE(SUM(Purchases.price), 0) AS total
            FROM Purchases
            JOIN Receipts ON Receipts.ID = Purchases.receiptID
            WHERE Receipts.shopperID = ?
                AND ${dateCondition}`;

        pool.query(sql, [shopperID], (error, results) => {
            if (error) return reject(error.sqlMessage);
            resolve(parseFloat(results[0].total));
        });
    }
    );

const getNumStoresVisited = (shopperID, timeUnits) =>
    new Promise((resolve, reject) => {
        const dateCondition = getDateCondition(timeUnits, 'Receipts');
        const sql = `
            SELECT COUNT(DISTINCT Receipts.storeID) AS total
            FROM Receipts
            WHERE Receipts.shopperID = ?
                AND ${dateCondition}`;
        pool.query(sql, [shopperID], (error, results) => {
            if (error) return reject(error.sqlMessage);
            resolve(results[0].total);
        });
    }
    );

export const handler = async (event, context) => {

    // Creating header
    const headers = {
        ...corsHeaders(event),
        "Content-Type": "application/json",
    }

    context.callbackWaitsForEmptyEventLoop = false;
    const timeUnits = event.queryStringParameters?.timeUnit || 'month'; // 'day', 'week', 'month', 'year'

    let code
    let results = {}
    const shopperID =
        event?.requestContext?.authorizer?.claims?.sub ||
        event?.requestContext?.authorizer?.jwt?.claims?.sub;

    try {
        const numReceipts = await getNumReceipts(shopperID, timeUnits)
        const numPurchases = await getNumPurchases(shopperID, timeUnits)
        const totalPurchaseAmount = await getTotalPurchaseAmount(shopperID, timeUnits)
        const numStoresVisited = await getNumStoresVisited(shopperID, timeUnits)
        code = 200
        results = {
            timeUnit: timeUnits,
            numReceipts,
            numPurchases,
            totalPurchaseAmount,
            numStoresVisited
        }
    } catch (error) {
        console.log("Database query error:", error);
        code = 500
    }

    const response = {
        statusCode: code,
        headers: headers,
        body: JSON.stringify(results)
    }

    return response

};