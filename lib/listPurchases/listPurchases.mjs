import mysql from "mysql2"
import { corsHeaders } from "./cors.mjs"

// Get all purchases with related data in a single query using JOINs
let getPurchasesWithDetails = (connection, shopperID) => {
    return new Promise((resolve, reject) => {
        const sqlQuery = `
            SELECT 
                p.ID as purchaseID,
                p.price as purchasePrice,
                p.date as purchaseDate,
                p.quantity as purchaseQuantity,
                i.name as itemName,
                i.category as itemCategory,
                i.mostRecentPrice as itemMostRecentPrice,
                s.houseNumber,
                s.street,
                s.city,
                s.state,
                s.postCode,
                s.country,
                c.name as chainName
            FROM Purchases p
            INNER JOIN Items i ON p.itemID = i.ID
            INNER JOIN Receipts r ON p.receiptID = r.ID
            INNER JOIN Stores s ON r.storeID = s.ID
            INNER JOIN Chains c ON s.chainID = c.ID
            WHERE r.shopperID = ?;
        `;
        connection.query(sqlQuery, [shopperID], (error, results) => {
            if (error) reject(error)
            else resolve(results)
        })
    })
}

export const handler = async (event) => {
    const headers = {
        ...corsHeaders(event),
        "Content-Type": "application/json",
    }

    // specify credentials
    var connection = mysql.createConnection({
        host: process.env.DB_HOST, // DB endpoint url
        user: process.env.DB_USER, // DB root username
        password: process.env.DB_PASSWORD, // DB password for root user
        database: process.env.DB_NAME // DB identifier
    })

    // return JSON object
    let statusCode
    let body
    try {
        const shopperID = event?.requestContext?.authorizer?.claims?.sub || event?.requestContext?.authorizer?.jwt?.claims?.sub;
        const purchases = await getPurchasesWithDetails(connection, shopperID)
        // success
        statusCode = 200
        body = {
            purchases: purchases.map((p) => ({
                purchaseId: p.purchaseID,
                itemName: p.itemName,
                itemCategory: p.itemCategory,
                itemMostRecentPrice: p.itemMostRecentPrice,
                purchaseDate: p.purchaseDate,
                purchasePrice: p.purchasePrice,
                purchaseQuantity: p.purchaseQuantity,
                chainName: p.chainName,
                address: {
                    houseNumber: p.houseNumber,
                    street: p.street,
                    city: p.city,
                    state: p.state,
                    postCode: p.postCode,
                    country: p.country
                }
            }))
        }
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
        connection.end()
    }
    const response = {
        statusCode,
        headers: headers, 
        body: JSON.stringify(body)
    }
    return response
}