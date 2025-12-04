import mysql from "mysql2"
import { corsHeaders } from "./cors.mjs"

// Add stores
let addStores = (connection, chainId, requestBody) => {
    return new Promise((resolve, reject) => {
        
        // Prepare values array with chainId prepended to each store's data
        const storeValues = [[
            chainId,
            requestBody.address.houseNumber,
            requestBody.address.street,
            requestBody.address.city,
            requestBody.address.state,
            requestBody.address.postCode,
            requestBody.address.country
        ]];

        const sqlQuery = "INSERT INTO Stores (chainID, houseNumber, street, city, state, postCode, country) VALUES ?";
        connection.query(sqlQuery, [storeValues], (error, results) => {
            if (error) reject(error)
            else resolve({
                id: results.insertId,
                address: requestBody.address
            })
        })
    })
}

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
    })

    // return JSON object
    let statusCode
    let body
    try {
        const chainId = event.pathParameters?.chainId;
        const requestBody = JSON.parse(event.body);

        if (!chainId) {
            statusCode = 400;
            body = { error: "Missing chainId parameter" };
        } else if (!requestBody.address) {
            statusCode = 400;
            body = { error: "Missing address in request body" };
        } else {
            const storeAdded = await addStores(connection, chainId, requestBody);
            console.log("Store added: ", storeAdded);

            // success
            statusCode = 200;
            body = {
                id: storeAdded.id,
                address: storeAdded.address
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
        statusCode,
        headers: headers,
        body: JSON.stringify(body)
    };

    return response;
}
