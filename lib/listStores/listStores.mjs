import mysql from "mysql2";

// search for stores of the given chain
const getStores = (connection, chainId) => {
    return new Promise((resolve, reject) => {
        const sqlQuery = "SELECT * FROM Stores WHERE chainID=?;"
        connection.query(sqlQuery, [chainId], (error, results) => {
            if (error) {
                console.log("Database error: ", error);
                reject(error);
            }
            else resolve(results);
        });
    });
} 

export const handler = async (event) => {

    // specify credentials
    const connection = mysql.createConnection({
        host: process.env.DB_HOST, // DB endpoint url
        user: process.env.DB_USER, // DB root username
        password: process.env.DB_PASSWORD, // DB password for root user
        database: process.env.DB_NAME // DB identifier
    });

    // return JSON object
    let statusCode;
    let body;

    const chainId = event.queryStringParameters?.chainId; 
    console.log("chainId: ", chainId);

    try {

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
    } catch (error) {
        // failure
        statusCode = 400;
        console.error("Database query error: ", error);
    } finally {
        connection.end();
    }

    const response = {
        statusCode: statusCode,
        body: JSON.stringify(body)
    };

    return response;
}