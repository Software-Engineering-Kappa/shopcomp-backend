import mysql from 'mysql'

var pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
})

let getTotalReceipts = (shopperID) => {
    return new Promise((resolve, reject) => {
        pool.query(
            "SELECT COUNT(*) FROM Receipts WHERE shopperID=?", [shopperId], (error, results) => {
                if (error) { return reject(error.sqlMessage) }
                return resolve(results[0]['COUNT(*)']) // need to test
            }
        )
    })
}

let getTotalShoppingLists = (shopperID) => {
    return new Promise((resolve, reject) => {
        pool.query(
            "SELECT COUNT(*) FROM ShoppingLists WHERE shopperID=?", [shopperId], (error, results) => {
                if (error) { return reject(error.sqlMessage) }
                return resolve(results[0]['COUNT(*)']) // need to test
            }
        )
    })
}

let getTotalPurchases = (shopperID) => {
    return new Promise((resolve, reject) => {
        pool.query(
            "SELECT COUNT(*) FROM Purchases LEFT JOIN Receipts ON Purchases.receiptID = Receipts.ID WHERE shopperID=?", [shopperId], (error, results) => {
                if (error) { return reject(error.sqlMessage) }
                return resolve(results[0]['COUNT(*)']) // need to test
            }
        )
    })
}

export const handler = async (event) => {
    let code
    let results = {}
    const shopperID = event.requestContext.accountId
    try {
        // const totalReceipts = await getTotalReceipts(shopperId) // checkshopperId retrieval method
        // const totalShoppingLists = await getTotalShoppingLists(shopperId)
        // const totalPurchases = await getTotalPurchases(shopperId)
        console.log("shopperId: ", shopperId)
        code = 200
        results = {
            totalReceipts: totalReceipts,
            totalShoppingLists: totalShoppingLists,
            totalPurchases: totalPurchases
        }
        // const moneySaved = 1000; // Pending calculation logic
    } catch (error) {
        console.log("Database query error: ", error)
        code = 400
    }

    const response = {
        statusCode: code,
        body: JSON.stringify(results)
    }
}

// /shopper/dashboard:
// 	GET:	
// 		200:
// 			{"totalReceipts": 5,
// 			 "totalShoppingList": 3,
// 			 "totalPurchases": 120,
// 			 "moneySaved": 1000}
// 	# Only has 401 error