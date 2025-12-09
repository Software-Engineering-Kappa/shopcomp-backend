import mysql from "mysql2";
import corsHeaders from "cors.mjs";

// deletes a purchase of the given purchaseId on the receipt of the given receiptId
const deletePurchase = (connection, purchaseId) => {
    return Promise((resolve, reject) => {
        const sqlQuery = `DELETE FROM Purchases WHERE ID=? LIMIT 1`
        connection.query(sqlQuery, [purchaseId], (error, results) => {
            if (error) reject(error);
            else resolve(results);
        });
    });
};

// returns remaining purchases after deletion of the given receiptId
const getPurchases = (connection, receiptId) => {
    return Promise((resolve, reject) => {
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
        "Content-Type": "application/json",
    };

    // construct JSON return package
    let statusCode;
    let body;

    let connection;
    try {
        // specify credentials
        connection = mysql.createConnection({
            host: process.env.DB_HOST, // DB endpoint url
            user: process.env.DB_USER, // DB root username
            password: process.env.DB_PASSWORD, // DB password for root user
            database: process.env.DB_NAME // DB identifier
        });

        const receiptId = event.paramters?.purchaseId;
        const purchaseId = event.parameters?.purchaseId;

        // ensure present and valid parameters
        if (!receiptId || receiptId < 0) { // missing or negative receiptId
            console.log("Missing or invalid receiptId");
            statusCode = 400;
            body = { "error": "Missing or invalid receiptId" };
        } else if (!purchaseId || purchaseId < 0) { // missing or negative purchaseId
            console.log("Missing or invalid purchaseId");
            statusCode = 400;
            body = { "error": "Missing or invalid purchaseId" };
        } else { // present and valid parameters
            const deletionResult = await deletePurchase(connection, purchaseId);

            if (deletionResult.affectedRows < 1) {
                statusCode = 400;
                body = { error: "No purchases deleted" };
            } else { // deletion success
                const remainingPurchases = await getPurchases(connection, receiptId);

                // selection success
                statusCode = 200;
                body = {
                    items: remainingPurchases.map((p) => ({
                        purchaseId: p.purchaseId,
                        itemName: p.itemName,
                        price: p.price,
                        category: p.category,
                        quantity: p.quantity
                    }))
                };
            }
        }
    } catch (error) { // database query error
        console.log("Database query error occurred: " + error);
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
