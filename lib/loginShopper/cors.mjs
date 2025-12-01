const allowedOrigins = [
  "http://localhost",    // local development
  "http://shop-comp-s3-bucket.s3-website-us-east-1.amazonaws.com"
];

/**
 * Returns the CORS Access-Control headers for the given `event`
 */
export function corsHeaders(event) {
  // Get origin of the request
  const origin = event.headers.origin || event.headers.Origin;

  const responseOrigin = allowedOrigins.includes(origin)
    ? origin
    : allowedOrigins[0]; // fallback to localhost

  return {
    "Access-Control-Allow-Origin": responseOrigin,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization"
  }
}

