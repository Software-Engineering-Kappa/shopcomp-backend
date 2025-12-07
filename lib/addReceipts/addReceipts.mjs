import mysql from "mysql2";
import { corsHeaders } from  "./cors.mjs";

// Add chains
let addReceipt = (connection, date, storeId, shopperId) => {
    return new Promise((resolve, reject) => {

        // console.log("date: " + date); // test
        // console.log("storeID: " + storeId); // test
        // console.log("shopperId: " + shopperId); // test

        // Inserts ONE receipt into the Receipts table
        const sqlQuery = "INSERT INTO Receipts (date, storeID, shopperID) VALUES (?, ?, ?);";
        connection.query(sqlQuery, [date, storeId, shopperId], (error, results) => {
            if (error) reject(error);
            else resolve(results);
        });
    });
};

export const handler = async (event) => {
    const headers = {
        ...corsHeaders(event),
        "Content-Type": "applications/json"
    }

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

        let isoDate;
        let badDate = false;

        // checks and formats date
        if (requestBody.date) {
            if (requestBody.date === "") {
                // date empty
                statusCode = 400;
                body = { error: "Date is empty" };
                badDate = true;
            }
            isoDate = new Date(requestBody.date);
            if (isNaN(isoDate)) {
                statusCode = 400;
                body = { error: "Invalid date format"};
                badDate = true;
            }
            isoDate = isoDate.toISOString();
        }

        if (!requestBody.storeId) {
            // missing storeID
            statusCode = 400;
            body = { error: "Missing storeID in request body" };
        } else if (!requestBody.date) {
            // missing date
            statusCode = 400;
            body = { error: "Missing date in request body" };
        } else if (badDate) {
            // return package already set, just here for the else chain
        }
        else {
            const receiptAdded = await addReceipt(connection, isoDate, requestBody.storeId, shopperId);

            console.log("Receipt added: ", receiptAdded); // test

            // success
            statusCode = 200;
            body = {
                receipt: {
                    receiptId: receiptAdded.insertId,
                    chainId: requestBody.chainID,
                    storeId: receiptAdded.storeID,
                    date: isoDate.slice(0, 19).replace("T", " "),
                    purchases: []
                }
            };
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
        connection.end();
    }

    const response = {
        statusCode: statusCode,
        headers: headers,
        body: JSON.stringify(body)
    };

    return response;
}
