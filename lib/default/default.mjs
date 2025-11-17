export const handler = async (event) => {
  // Log the incoming event for debugging
  console.log("Received event:", JSON.stringify(event, null, 2))

  let responseBody
  let statusCode = 200
  const headers = {
    "Content-Type": "application/json"
  }

  try {
    // Acknowledge POST request
    if (event.httpMethod === "POST") {
      const requestData = JSON.parse(event.body)
      responseBody = { message: `Received POST request with data: ${requestData}` }
    }

    // Acknowledge GET request
    else if (event.httpMethod === "GET") {
      const pathParams = event.pathParameters
      responseBody = { message: `Received GET request with pathParameters: ${pathParams}` }
    }

    // Default response for other methods or paths
    else {
      responseBody = { message: `Hello from Lambda!` }
    }
  } catch (error) {
    console.error("Error processing request: ", error)
    statusCode = 500
    responseBody = { message: "Internal server error" }
  }


  const response = {
    statusCode: statusCode,
    headers: headers,
    body: responseBody,
  }
  return response
}
