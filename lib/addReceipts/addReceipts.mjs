import mysql from "mysql2";

// Add chains
let addReceipt = (connection, requestBody, shopperId) => {
    return new Promise((resolve, reject) => {
        
        // the values to set the new receipt to
        const date = requestBody.date;
        const storeID = requestBody.storeId; // could also be storeID?

        // Inserts ONE receipt into the Receipts table
        const sqlQuery = "INSERT INTO Receipts (date, storeID, shopperID) VALUES (?, ?, ?);";
        connection.query(sqlQuery, [date, storeId, shopperId], (error, results) => {
            if (error) reject(error);
            else resolve(results);
        });
    });
};

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
        const requestBody = JSON.parse(event.body);

        const shopperId =
            event?.requestContext?.authorizer?.claims?.sub ||
            event?.requestContext?.authorizer?.jwt?.claims?.sub;
        
        if (!requestBody.requestBody.date) {
            // missing date
            statusCode = 400;
            body = { error: "Missing date in request body" };
        } else if (!requestBody.requestBody.storeId) {
            // missing storeID
            statusCode = 400;
            body = { error: "Missing storeID in request body" };
        } else if (requestBody.date === "") {
            // date empty
            statusCode = 400;
            body = { error: "Date is empty" };
        }
        else {
            const receiptAdded = await addReceipt(connection, requestBody, shopperId);

            console.log("Receipt added: ", receiptAdded); // test

            // success
            statusCode = 200;
            body = {
                receipt: {
                    id: results.insertId,
                    chainId: requestBody.chainID,
                    storeId: receiptAdded.storeID,
                    date: receiptAdded.date.toISOString().slice(0, 19).replace("T", " "),
                    purchases: []
                }
            };
        }
    } catch (error) {
        // failure
        statusCode = 400;
        console.error("Database query error: ", error);
        body = { error: "Database query failed" };
    } finally {
        connection.end();
    }

    const response = {
        statusCode: statusCode,
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST,OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type,Authorization"
        },
        body: JSON.stringify(body)
    };

    return response;
}