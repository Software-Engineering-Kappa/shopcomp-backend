import mysql from "mysql2";

// search for stores of the given chain
async function getStores(connection, chainId) {
    return new Promise((resolve, reject) => {
        const sqlQuery = "SELECT * FROM Stores WHERE chainID=?"
        connection.query(sqlQuery, [chainId], (error, results) => {
            if (error) reject(error);
            else resolve(results);
        });
    });
} 

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
        const chainId = event.pathParameters?.chainId;
        
        if (!chainId) {
            statusCode = 400;
            body = { error: "Missing chainId parameter" };
        } else {
            const stores = await getStores(connection, chainId);

            // success
            statusCode = 200;
            body = {
                stores: stores
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
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET,OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type,Authorization"
        },
        body: JSON.stringify(body)
    };

    return response;
}