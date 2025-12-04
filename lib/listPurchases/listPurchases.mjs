import mysql from "mysql2"
import { corsHeaders } from "./cors.mjs"

// Get purchases, frontend will filter by name
let getPurchases = (connection) => {
    return new Promise((resolve, reject) => {
        const sqlQuery = "SELECT * FROM Purchases;"
        connection.query(sqlQuery, (error, results) => {
            if (error) reject(error)
            else resolve(results)
        })
    })
}

// Helper functions to get additional info for each purchase
let getPurchaseItem = (connection, itemID) => {
    return new Promise((resolve, reject) => {
        const sqlQuery = "SELECT * FROM Items WHERE ID = ?;"
        connection.query(sqlQuery, [itemID], (error, results) => {
            if (error) reject(error)
            else resolve(results)
        })
    })
}

let getPurchaseReceipt = (connection, receiptID) => {
    return new Promise((resolve, reject) => {
        const sqlQuery = "SELECT * FROM Receipts WHERE ID = ?;"
        connection.query(sqlQuery, [receiptID], (error, results) => {
            if (error) reject(error)
            else resolve(results)
        })
    })
}

let getPurchaseStore = (connection, storeID) => {
    return new Promise((resolve, reject) => {
        const sqlQuery = "SELECT * FROM Stores WHERE ID = ?;"
        connection.query(sqlQuery, [storeID], (error, results) => {
            if (error) reject(error)
            else resolve(results)
        })
    })
}

let getPurchaseChain = (connection, chainID) => {
    return new Promise((resolve, reject) => {
        const sqlQuery = "SELECT * FROM Chains WHERE ID = ?;"
        connection.query(sqlQuery, [chainID], (error, results) => {
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
        const purchases = await getPurchases(connection)
        // success
        statusCode = 200
        body = {
            // Enrich purchases with item, receipt, store, and chain details
            purchases: await Promise.all(purchases.map(async (p) => {
                const item = (await getPurchaseItem(connection, p.itemID))[0]
                const receipt = (await getPurchaseReceipt(connection, p.receiptID))[0]
                const store = (await getPurchaseStore(connection, receipt.storeID))[0]
                const chain = (await getPurchaseChain(connection, store.chainID))[0]

                return {
                    id: p.ID,
                    itemName: item.name,
                    itemCategory: item.category,
                    itemMostRecentPrice: item.mostRecentPrice,
                    purchaseDate: p.date,
                    purchasePrice: p.price,
                    chainName: chain.name,
                    address: {
                        houseNumber: store.houseNumber,
                        street: store.street,
                        city: store.city,
                        state: store.state,
                        postCode: store.postCode,
                        country: store.country
                    }
                }
            }))
        }
    } catch (error) {
        // failure
        statusCode = 400
        console.error("Database query error: ", error)
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