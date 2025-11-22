import mysql from "mysql2"

// Get chains, frontend will filter by name
let getChains = (connection) => {
    return new Promise((resolve, reject) => {
        const sqlQuery = "SELECT * FROM Chains;"
        connection.query(sqlQuery, (error, results) => {
            if (error) reject(error)
            else resolve(results)
        })
    })
}

export const handler = async () => {

    // specify credentials
    var connection = mysql.createConnection({
        host: process.env.DB_HOST, // DB endpoint url
        user: process.env.DB_USER, // DB root username
        password: process.env.DB_PASSWORD, // DB password for root user
        database: process.env.DB_DATABASE // DB identifier
    })

    // return JSON object
    let statusCode
    let body
    try {
        const chains = await getChains(connection)
        // success
        statusCode = 200
        body = {
            chains: chains
        }
    } catch (error) {
        // failure
        statusCode = 400
        console.error("Database query error: ", error)
    }
    const response = {
        statusCode,
        body: JSON.stringify(body)
    }
    return response
}