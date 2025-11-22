import mysql from "mysql2";

// search for stores of the given chain, with the query in their address somewhere
async function getStores(query, chainId) {
    return new Promise((resolve, reject) => {
        const sqlQuery = "SET @query = ?; SELECT * FROM Stores WHERE chainID=? AND (houseNumber LIKE '%@query%' OR street LIKE '%@query%' OR city LIKE '%@query%' OR state LIKE '%@query%' OR postCode LIKE '%@query%' OR country LIKE '%@query%');";
        connection.query(sqlQuery, [query, chainId], (error, results) => {
            if (error) reject(error);
            else resolve(results);
        });
    });
}

export const handler = async (event) => {

    // specify credentials
    var connection = mysql.createConnection({
        host: process.env.RDS_HOST, // DB endpoint url
        user: process.env.RDS_USER, // DB root username
        password: process.env.RDS_PASSWORD, // DB password for root user
        database: process.env.RDS_DATABASE // DB identifier
    });

    // return JSON object
    let statusCode;
    let body;

    try {
        const stores = await getStores(query, chainId);

        // success
        code = 200;
        results = {
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
    } catch (error) {
        // failure
        code = 400;
        console.error("Database query error: ", error);
    }

    const response = {
        statusCode: statusCode,
        body: JSON.stringify(results)
    };
}