// Handles JWT token parsing and extraction
 

export interface JWTPayload {
  userId?: string;
  id?: string;
  role?: "assignee" | "admin"; 
  email?: string;
}

/**
 * Parse JWT token 
 * input: token - JWT token string
 * returns: Decoded payload
 * throws: Error if token is invalid
 * - the token is a string that is separated by a dot (.)
 * - the first part is the header, the second part is the payload, the third part is the signature
 * - the header contains the algorithm used to sign the token, the payload contains the user information
 * - the signature is used to verify the token
 * - we need to parse the token to get the user information

 const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf-8"));
  parse the payload part of the token to get the user information. 
  Buffer.from(parts[1], "base64url") → decodes that one segment from base64url to UTF-8 JSON
  JSON.parse(...) → turns it into an object (e.g., { userId: "123", role: "admin", email: "a@b.com" })

 */
export const parseJWT = (token: string): JWTPayload => {
  const parts = token.split(".");
  
  if (parts.length !== 3) {
    throw new Error("Invalid token format");
  }
  const payload = JSON.parse(
    Buffer.from(parts[1], "base64url").toString("utf-8")
  );
  return payload as JWTPayload;
};

/**
 * Extract token from Authorization header
 * Supports "Bearer <token>" format
 * input: authHeader - Authorization header value from the HTTP request headers, headers can be 
 * string or an array of strings or undefined 
 * authHeader: Bearer <token> :   <token> is the JWT token
 * returns: Token string or null
 */
export const extractTokenFromHeader = (authHeader?: string | string[]): string | null => {
  if (!authHeader) {return null;}
  
  // if the header is an array, get the first element, if the header is a string, get the string
  const headerValue = Array.isArray(authHeader) ? authHeader[0] : authHeader;
  
  // if the header value is undefined, return null 
  if (!headerValue) {return null;}
  
  // Extract token from "Bearer <token>" format, if the header value is not in the format of 
  // "Bearer <token>", return null
  const match = headerValue.match(/^Bearer\s+(.+)$/i);

  return match ? match[1] : null;
};

