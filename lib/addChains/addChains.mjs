import mysql from "mysql2";

// Add chains
let addChain = (connection, requestBody) => {
    return new Promise((resolve, reject) => {
        
        // the values to set the new chain to
        const chainName = requestBody.name;

        // Inserts ONE chain into the Chains table
        const sqlQuery = "INSERT INTO Chains (name) VALUES (?);";
        connection.query(sqlQuery, [chainName], (error, results) => {
            if (error) reject(error);
            else resolve({
                id: results.insertId,
                name: requestBody.name
            });
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
        
        if (!requestBody.name) {
            // missing name
            statusCode = 400;
            body = { error: "Missing name in request body" };
        } else if (requestBody.name === "") {
            // name empty
            statusCode = 400;
            body = { error: "Name is empty" };
        }
        else {
            const chainAdded = await addChain(connection, requestBody);
            console.log("Chain added: ", chainAdded);

            // success
            statusCode = 200;
            body = {
                id: chainAdded.id,
                name: chainAdded.name
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
            "Access-Control-Allow-Methods": "POST,OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type,Authorization"
        },
        body: JSON.stringify(body)
    };

    return response;
}