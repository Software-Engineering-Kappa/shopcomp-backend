import mysql from "mysql2";

// search for all receipts
async function getReceipts(chainId) {
    return new Promise((resolve, reject) => {
        const sqlQuery = "SELECT * FROM Stores WHERE chainID=?"
        connection.query(sqlQuery, (error, results) => {
            if (error) reject(error);
            else resolve(results);
        });
    });
}

export const handler = async () => {

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
        const receipts = await getReceipts(chainId);

        // success
        code = 200;
        results = {
            receiptList: receipts.map((r) => {
                receiptId: r.ID,
                storeName: r.
            })
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

// Initial query to get receipts
// ? will be the shopperID

// SELECT
//     Receipts.ID,
//     Chains.name as chainName,
//     Receipts.date
// FROM
//     Receipts
//     JOIN Stores ON Receipts.storeID = Stores.ID
//     JOIN Chains ON Stores.chainID = Chains.ID
// WHERE
//     Receipts.shopperID=?;

// // Query each receipt to get purchases
// // ? will be the receiptID

// SELECT
//     Purchases.price
// FROM
//     Purchases
// WHERE 
//     Purchases.receiptID=?;