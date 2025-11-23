import mysql from "mysql2";

// search for stores of the given chain
async function getStores(chainId) {
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
        const stores = await getStores(chainId);

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

    return response;
}