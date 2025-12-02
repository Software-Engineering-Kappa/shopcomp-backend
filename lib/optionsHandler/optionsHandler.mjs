const allowedOrigins = [
  "http://localhost:3000",    // local development
  "http://localhost:3001",    // local development
  "http://shop-comp-s3-bucket.s3-website-us-east-1.amazonaws.com"
]

export const handler = async (event) => {
  const origin = event.headers.origin || event.headers.Origin
  const allowOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0]
  console.log("Allowing origin: ", allowOrigin)

  return {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": allowOrigin,
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Api-Key,X-Amz-Date,X-Amz-Security-Token,Accept,Origin,User-Agent",
      "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    },
    body: "",
  }
}

