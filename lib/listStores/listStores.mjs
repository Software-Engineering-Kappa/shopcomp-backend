import mysql from "mysql2";
import { corsHeaders } from "./cors.mjs";

// search for stores of the given chain
async function getStores(connection, chainId) {
    return new Promise((resolve, reject) => {
        const sqlQuery = "SELECT * FROM Stores WHERE chainID=? AND isDeleted=FALSE;";
        connection.query(sqlQuery, [chainId], (error, results) => {
            if (error) reject(error);
            else resolve(results);
        });
    });
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
    });

    // return JSON object
    let statusCode;
    let body;

    try {
        const chainId = event.pathParameters?.chainId;
        
        if (!chainId) {
            statusCode = 400;
            body = { error: "Missing chainId parameter" };
        } else {
            const stores = await getStores(connection, chainId);

            // success
            statusCode = 200;
            body = {
                stores: stores.map((s) => ({
                    id: s.ID,
                    address: {
                        houseNumber: s.houseNumber,
                        street: s.street,
                        city: s.city,
                        state: s.state,
                        postCode: s.postCode,
                        country: s.country
                    }
                })) 
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
        statusCode,
        headers: headers,
        body: JSON.stringify(body)
    };

    return response;
}
